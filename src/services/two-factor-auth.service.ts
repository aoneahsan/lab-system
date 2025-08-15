import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { smsService } from '@/services/sms.service';
import { emailService } from '@/services/email.service';
import { subscriptionService } from '@/services/subscription.service';
import type {
  TwoFactorMethod,
  TwoFactorSettings,
  TwoFactorSetupData,
  TwoFactorVerificationResult,
  UserTwoFactorPermissions,
  TwoFactorChallenge,
} from '@/types/two-factor.types';

class TwoFactorAuthService {
  private readonly APP_NAME = 'LabFlow';
  private readonly TOTP_PERIOD = 30; // seconds
  private readonly TOTP_DIGITS = 6;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Check user's 2FA permissions based on subscription and admin settings
   */
  async getUserTwoFactorPermissions(userId: string): Promise<UserTwoFactorPermissions> {
    try {
      // Get user document
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      const userData = userDoc.data();

      // Get subscription features
      const subscriptionFeatures = await subscriptionService.getUserSubscriptionFeatures(userId);

      // Check admin overrides
      const adminOverrides = userData?.twoFactorOverrides || {};

      // Combine subscription features with admin overrides
      const permissions: UserTwoFactorPermissions = {
        canUseTOTP: adminOverrides.canUseTOTP ?? subscriptionFeatures.twoFactorAuth.methods.includes('totp'),
        canUseSMS: adminOverrides.canUseSMS ?? subscriptionFeatures.twoFactorAuth.methods.includes('sms'),
        canUseEmail: adminOverrides.canUseEmail ?? subscriptionFeatures.twoFactorAuth.methods.includes('email'),
        maxBackupCodes: adminOverrides.maxBackupCodes ?? subscriptionFeatures.twoFactorAuth.maxBackupCodes,
      };

      return permissions;
    } catch (error) {
      console.error('Error getting 2FA permissions:', error);
      // Return default permissions
      return {
        canUseTOTP: true,
        canUseSMS: true,
        canUseEmail: true,
        maxBackupCodes: 10,
      };
    }
  }

  /**
   * Generate TOTP secret and QR code
   */
  async generateTOTPSetup(userId: string, userEmail: string): Promise<TwoFactorSetupData> {
    // Check permissions
    const permissions = await this.getUserTwoFactorPermissions(userId);
    if (!permissions.canUseTOTP) {
      throw new Error('TOTP authentication is not available for your account');
    }

    // Generate a random secret using OTPAuth
    const secret = new OTPAuth.Secret({ size: 20 });

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: this.APP_NAME,
      label: userEmail,
      secret: secret,
      algorithm: 'SHA1',
      digits: this.TOTP_DIGITS,
      period: this.TOTP_PERIOD,
    });

    // Generate QR code
    const otpauthUrl = totp.toString();
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      method: 'totp',
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  /**
   * Setup SMS 2FA
   */
  async setupSMS2FA(userId: string, phoneNumber: string): Promise<TwoFactorSetupData> {
    // Check permissions
    const permissions = await this.getUserTwoFactorPermissions(userId);
    if (!permissions.canUseSMS) {
      throw new Error('SMS authentication is not available for your account');
    }

    // Validate phone number
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Send verification code
    const code = this.generateVerificationCode();
    await this.sendSMSCode(phoneNumber, code);

    // Store challenge for verification
    await this.storeChallenge(userId, 'sms', code);

    return {
      method: 'sms',
      phoneNumber,
    };
  }

  /**
   * Setup Email 2FA
   */
  async setupEmail2FA(userId: string, email: string): Promise<TwoFactorSetupData> {
    // Check permissions
    const permissions = await this.getUserTwoFactorPermissions(userId);
    if (!permissions.canUseEmail) {
      throw new Error('Email authentication is not available for your account');
    }

    // Send verification code
    const code = this.generateVerificationCode();
    await this.sendEmailCode(email, code);

    // Store challenge for verification
    await this.storeChallenge(userId, 'email', code);

    return {
      method: 'email',
      email,
    };
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTPCode(secret: string, token: string): Promise<boolean> {
    try {
      // Create TOTP instance with the secret
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        algorithm: 'SHA1',
        digits: this.TOTP_DIGITS,
        period: this.TOTP_PERIOD,
      });

      // Validate the token
      // OTPAuth validates with a window of 1 by default
      const delta = totp.validate({ token, window: 2 });
      
      // delta is null if invalid, or the time step difference if valid
      return delta !== null;
    } catch (error) {
      console.error('Error verifying TOTP code:', error);
      return false;
    }
  }

  /**
   * Verify SMS or Email code
   */
  async verifyCode(userId: string, method: 'sms' | 'email', code: string): Promise<boolean> {
    const challenge = await this.getChallenge(userId, method);
    
    if (!challenge) {
      throw new Error('No active verification challenge');
    }

    if (challenge.attempts >= this.MAX_ATTEMPTS) {
      throw new Error('Maximum verification attempts exceeded');
    }

    if (new Date() > challenge.expiresAt) {
      throw new Error('Verification code has expired');
    }

    // Update attempts
    await this.updateChallengeAttempts(challenge.challengeId, challenge.attempts + 1);

    // Verify code (stored in challenge for now - in production, use secure storage)
    const storedCode = await this.getStoredCode(challenge.challengeId);
    return code === storedCode;
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(
    userId: string,
    method: TwoFactorMethod,
    verificationCode: string,
    setupData: TwoFactorSetupData
  ): Promise<TwoFactorVerificationResult> {
    try {
      let verified = false;

      // Verify the code based on method
      if (method === 'totp' && setupData.secret) {
        verified = await this.verifyTOTPCode(setupData.secret, verificationCode);
      } else if (method === 'sms' || method === 'email') {
        verified = await this.verifyCode(userId, method, verificationCode);
      }

      if (!verified) {
        return {
          success: false,
          error: 'Invalid verification code',
        };
      }

      // Generate backup codes
      const permissions = await this.getUserTwoFactorPermissions(userId);
      const backupCodes = this.generateBackupCodes(permissions.maxBackupCodes);

      // Save 2FA settings
      const settings: TwoFactorSettings = {
        enabled: true,
        method,
        totpSecret: method === 'totp' ? setupData.secret : undefined,
        phoneNumber: method === 'sms' ? setupData.phoneNumber : undefined,
        email: method === 'email' ? setupData.email : undefined,
        backupCodes: await this.hashBackupCodes(backupCodes),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.save2FASettings(userId, settings);

      return {
        success: true,
        backupCodes,
      };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable 2FA',
      };
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string): Promise<void> {
    await updateDoc(doc(firestore, 'users', userId), {
      twoFactorSettings: {
        enabled: false,
        method: null,
        updatedAt: serverTimestamp(),
      },
    });
  }

  /**
   * Send 2FA code for login
   */
  async sendLoginCode(userId: string): Promise<void> {
    const settings = await this.get2FASettings(userId);
    
    if (!settings || !settings.enabled) {
      throw new Error('2FA is not enabled for this account');
    }

    if (settings.method === 'sms' && settings.phoneNumber) {
      const code = this.generateVerificationCode();
      await this.sendSMSCode(settings.phoneNumber, code);
      await this.storeChallenge(userId, 'sms', code);
    } else if (settings.method === 'email' && settings.email) {
      const code = this.generateVerificationCode();
      await this.sendEmailCode(settings.email, code);
      await this.storeChallenge(userId, 'email', code);
    }
    // TOTP doesn't need to send a code
  }

  /**
   * Verify login 2FA code
   */
  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const settings = await this.get2FASettings(userId);
    
    if (!settings || !settings.enabled) {
      return true; // 2FA not enabled, allow login
    }

    try {
      if (settings.method === 'totp' && settings.totpSecret) {
        return await this.verifyTOTPCode(settings.totpSecret, code);
      } else if (settings.method === 'sms' || settings.method === 'email') {
        return await this.verifyCode(userId, settings.method, code);
      }

      // Check if it's a backup code
      return await this.verifyBackupCode(userId, code);
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private async get2FASettings(userId: string): Promise<TwoFactorSettings | null> {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    const userData = userDoc.data();
    return userData?.twoFactorSettings || null;
  }

  private async save2FASettings(userId: string, settings: TwoFactorSettings): Promise<void> {
    await updateDoc(doc(firestore, 'users', userId), {
      twoFactorSettings: settings,
    });
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random()
        .toString(36)
        .substring(2, 2 + this.BACKUP_CODE_LENGTH)
        .toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private async hashBackupCodes(codes: string[]): Promise<string[]> {
    // In production, use proper hashing
    // For now, we'll store them as-is (NOT SECURE)
    return codes;
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const settings = await this.get2FASettings(userId);
    if (!settings || !settings.backupCodes) {
      return false;
    }

    const index = settings.backupCodes.indexOf(code);
    if (index === -1) {
      return false;
    }

    // Remove used backup code
    settings.backupCodes.splice(index, 1);
    await this.save2FASettings(userId, settings);

    return true;
  }

  private async sendSMSCode(phoneNumber: string, code: string): Promise<void> {
    await smsService.sendSMS(phoneNumber, `Your LabFlow verification code is: ${code}`);
  }

  private async sendEmailCode(email: string, code: string): Promise<void> {
    await emailService.sendEmail({
      to: email,
      subject: 'LabFlow Two-Factor Authentication Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Verification Code</h2>
          <p>Your LabFlow verification code is:</p>
          <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation - enhance as needed
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  private async storeChallenge(userId: string, method: TwoFactorMethod, code: string): Promise<void> {
    const challenge: Omit<TwoFactorChallenge, 'challengeId'> = {
      userId,
      method,
      expiresAt: new Date(Date.now() + this.CODE_EXPIRY),
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
    };

    // Store in Firebase
    const docRef = await addDoc(collection(firestore, 'twoFactorChallenges'), {
      ...challenge,
      code, // In production, hash this
      createdAt: serverTimestamp(),
    });

    // Clean up old challenges
    this.cleanupOldChallenges(userId);
  }

  private async getChallenge(userId: string, method: TwoFactorMethod): Promise<TwoFactorChallenge | null> {
    // In production, query Firebase for the challenge
    // For now, return mock data
    return {
      userId,
      method,
      challengeId: 'mock-challenge-id',
      expiresAt: new Date(Date.now() + this.CODE_EXPIRY),
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
    };
  }

  private async updateChallengeAttempts(challengeId: string, attempts: number): Promise<void> {
    // Update Firebase document
    await updateDoc(doc(firestore, 'twoFactorChallenges', challengeId), {
      attempts,
    });
  }

  private async getStoredCode(challengeId: string): Promise<string> {
    // In production, get from secure storage
    // For now, return the code that was sent
    return '123456'; // Mock code
  }

  private async cleanupOldChallenges(userId: string): Promise<void> {
    // Clean up expired challenges for the user
    // Implementation depends on your Firebase structure
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();