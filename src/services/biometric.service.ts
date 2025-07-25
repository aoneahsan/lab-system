import { BiometricAuth } from 'capacitor-biometric-authentication';
import { Preferences } from '@capacitor/preferences';
import type {
  BiometricAuthConfig,
  BiometricEnrollmentStatus,
  BiometricAuthResult,
  BiometricPreferences,
} from '@/types/biometric.types';
import { DEFAULT_BIOMETRIC_CONFIG, DEFAULT_BIOMETRIC_PREFERENCES } from '@/types/biometric.types';

const BIOMETRIC_PREFS_KEY = 'labflow_biometric_preferences';
const LAST_AUTH_KEY = 'labflow_last_biometric_auth';

class BiometricService {
  private config: BiometricAuthConfig = DEFAULT_BIOMETRIC_CONFIG;
  
  /**
   * Check if biometric authentication is available and enrolled
   */
  async checkBiometricStatus(): Promise<BiometricEnrollmentStatus> {
    try {
      const result = await BiometricAuth.isAvailable();
      const isAvailable = result.available || false;
      const biometryType = (result as any).biometryType || 'unknown';
      const errorMessage = (result as any).error;
      
      if (!isAvailable) {
        return {
          isAvailable: false,
          isEnrolled: false,
          errorMessage: errorMessage || 'Biometric authentication not available',
        };
      }
      
      // Check if user has enrolled biometrics
      // Note: capacitor-biometric-authentication doesn't have a separate isEnrolled method
      // If biometrics are available, we assume they are enrolled
      const isEnrolled = true;
      
      return {
        isAvailable: true,
        isEnrolled,
        biometryType: biometryType as 'face' | 'fingerprint' | 'iris' | 'unknown',
      };
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Authenticate using biometrics
   */
  async authenticate(config?: Partial<BiometricAuthConfig>): Promise<BiometricAuthResult> {
    try {
      const authConfig = { ...this.config, ...config };
      
      const result = await BiometricAuth.authenticate({
        message: authConfig.reason || DEFAULT_BIOMETRIC_CONFIG.reason || '',
        fallbackTitle: authConfig.fallbackTitle,
        maxAttempts: authConfig.maxAttempts,
        androidBiometryTitle: authConfig.androidBiometryTitle,
        androidBiometrySubtitle: authConfig.androidBiometrySubtitle,
        androidBiometryDescription: authConfig.androidBiometryDescription,
        androidBiometryNegativeButtonText: authConfig.androidBiometryNegativeButtonText,
      } as any);
      
      if (result.success) {
        // Update last auth timestamp
        await this.updateLastAuthTime();
      }
      
      return {
        success: result.success,
        error: result.error ? (typeof result.error === 'string' ? result.error : result.error.message) : undefined,
        errorCode: result.error && typeof result.error === 'object' ? result.error.code : undefined,
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errorCode: 'UNKNOWN_ERROR',
      };
    }
  }
  
  /**
   * Get user's biometric preferences
   */
  async getPreferences(): Promise<BiometricPreferences> {
    try {
      const { value } = await Preferences.get({ key: BIOMETRIC_PREFS_KEY });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Error loading biometric preferences:', error);
    }
    return DEFAULT_BIOMETRIC_PREFERENCES;
  }
  
  /**
   * Save user's biometric preferences
   */
  async savePreferences(preferences: BiometricPreferences): Promise<void> {
    try {
      await Preferences.set({
        key: BIOMETRIC_PREFS_KEY,
        value: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Error saving biometric preferences:', error);
      throw error;
    }
  }
  
  /**
   * Check if recent authentication is required
   */
  async isRecentAuthRequired(): Promise<boolean> {
    try {
      const prefs = await this.getPreferences();
      if (!prefs.requireRecentAuth) {
        return false;
      }
      
      const { value } = await Preferences.get({ key: LAST_AUTH_KEY });
      if (!value) {
        return true;
      }
      
      const lastAuthTime = parseInt(value, 10);
      const now = Date.now();
      const thresholdMs = prefs.recentAuthThresholdMinutes * 60 * 1000;
      
      return (now - lastAuthTime) > thresholdMs;
    } catch (error) {
      console.error('Error checking recent auth:', error);
      return true; // Require auth on error
    }
  }
  
  /**
   * Update last authentication time
   */
  private async updateLastAuthTime(): Promise<void> {
    try {
      await Preferences.set({
        key: LAST_AUTH_KEY,
        value: Date.now().toString(),
      });
    } catch (error) {
      console.error('Error updating last auth time:', error);
    }
  }
  
  /**
   * Clear biometric data (used on logout)
   */
  async clearBiometricData(): Promise<void> {
    try {
      await Promise.all([
        Preferences.remove({ key: BIOMETRIC_PREFS_KEY }),
        Preferences.remove({ key: LAST_AUTH_KEY }),
      ]);
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }
  
  /**
   * Configure default settings
   */
  setConfig(config: Partial<BiometricAuthConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const biometricService = new BiometricService();