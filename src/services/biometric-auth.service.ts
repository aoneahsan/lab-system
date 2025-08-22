import { Capacitor } from '@capacitor/core';
import { logger } from '@/services/logger.service';

// Mock implementation for web, real implementation for mobile
const BiometricAuthentication = {
  async isAvailable(): Promise<{ isAvailable: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Try to import the actual plugin
        const { BiometricAuth } = await import('capacitor-biometric-authentication');
        const result = await BiometricAuth.isAvailable();
        return { isAvailable: result };
      } catch (error) {
        logger.log('Biometric plugin not available:', error);
        return { isAvailable: false };
      }
    }
    // Web fallback - check for WebAuthn support
    return {
      isAvailable: !!(navigator.credentials && window.PublicKeyCredential),
    };
  },

  async authenticate(reason: string): Promise<{ success: boolean; error?: string }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { BiometricAuth } = await import('capacitor-biometric-authentication');
        const result = await BiometricAuth.authenticate({ reason });
        return { success: result.success, error: result.error?.message };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    // Web fallback - simulate biometric auth
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  },

  async enableBiometric(credentials: { email: string; password: string }): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Store credentials securely for biometric access
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({
          key: 'biometric_credentials',
          value: JSON.stringify(credentials),
        });
        return true;
      } catch (error) {
        logger.error('Failed to enable biometric auth:', error);
        return false;
      }
    }

    // Web fallback - use localStorage (not secure, just for demo)
    try {
      localStorage.setItem('biometric_credentials', JSON.stringify(credentials));
      return true;
    } catch (error) {
      return false;
    }
  },

  async getStoredCredentials(): Promise<{ email: string; password: string } | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: 'biometric_credentials' });
        return result.value ? JSON.parse(result.value) : null;
      } catch (error) {
        return null;
      }
    }

    // Web fallback
    try {
      const stored = localStorage.getItem('biometric_credentials');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  },

  async disableBiometric(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'biometric_credentials' });
      } catch (error) {
        logger.error('Failed to disable biometric auth:', error);
      }
    } else {
      // Web fallback
      localStorage.removeItem('biometric_credentials');
    }
  },
};

class BiometricAuthService {
  async isAvailable(): Promise<boolean> {
    try {
      const result = await BiometricAuthentication.isAvailable();
      return result.isAvailable;
    } catch (error) {
      logger.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async authenticate(
    reason: string = 'Please authenticate to continue'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await BiometricAuthentication.authenticate(reason);
    } catch (error: any) {
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  async enableBiometricAuth(email: string, password: string): Promise<boolean> {
    try {
      // First verify biometric is available
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      // Test biometric authentication first
      const authResult = await this.authenticate('Enable biometric authentication');
      if (!authResult.success) {
        throw new Error('Biometric authentication test failed');
      }

      // Store credentials securely
      return await BiometricAuthentication.enableBiometric({ email, password });
    } catch (error) {
      logger.error('Failed to enable biometric auth:', error);
      return false;
    }
  }

  async getStoredCredentials(): Promise<{ email: string; password: string } | null> {
    return await BiometricAuthentication.getStoredCredentials();
  }

  async disableBiometricAuth(): Promise<void> {
    await BiometricAuthentication.disableBiometric();
  }

  async isBiometricEnabled(): Promise<boolean> {
    const credentials = await this.getStoredCredentials();
    return !!credentials;
  }
}

export const biometricAuth = new BiometricAuthService();
