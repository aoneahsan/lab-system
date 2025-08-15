export type TwoFactorMethod = 'totp' | 'sms' | 'email';

export interface TwoFactorSettings {
  enabled: boolean;
  method: TwoFactorMethod | null;
  totpSecret?: string;
  phoneNumber?: string;
  email?: string;
  backupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface TwoFactorSetupData {
  method: TwoFactorMethod;
  secret?: string;
  qrCodeUrl?: string;
  phoneNumber?: string;
  email?: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  error?: string;
  backupCodes?: string[];
}

export interface UserTwoFactorPermissions {
  canUseTOTP: boolean;
  canUseSMS: boolean;
  canUseEmail: boolean;
  maxBackupCodes: number;
}

export interface SubscriptionPlanFeatures {
  twoFactorAuth: {
    enabled: boolean;
    methods: TwoFactorMethod[];
    maxBackupCodes: number;
  };
  biometricAuth: boolean;
  advancedSecurity: boolean;
  auditLogs: boolean;
  sessionManagement: boolean;
}

export const DEFAULT_SUBSCRIPTION_FEATURES: SubscriptionPlanFeatures = {
  twoFactorAuth: {
    enabled: true,
    methods: ['totp', 'sms', 'email'],
    maxBackupCodes: 10,
  },
  biometricAuth: true,
  advancedSecurity: true,
  auditLogs: true,
  sessionManagement: true,
};

export interface TwoFactorChallenge {
  userId: string;
  method: TwoFactorMethod;
  challengeId: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}