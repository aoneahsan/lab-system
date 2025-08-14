import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '@/services/biometric.service';
import type {
  BiometricEnrollmentStatus,
  BiometricAuthResult,
  BiometricPreferences,
  BiometricAuthConfig,
} from '@/types/biometric.types';
import { useToast } from '@/hooks/useToast';

export const useBiometricAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricEnrollmentStatus | null>(null);
  const [preferences, setPreferences] = useState<BiometricPreferences | null>(null);
  const { showToast } = useToast();

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await biometricService.checkBiometricStatus();
      setBiometricStatus(status);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await biometricService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  // Check biometric status on mount
  useEffect(() => {
    checkStatus();
    loadPreferences();
  }, []);  

  const authenticate = useCallback(
    async (config?: Partial<BiometricAuthConfig>): Promise<BiometricAuthResult> => {
      try {
        setIsLoading(true);

        // Check if biometrics are available and enabled
        if (!biometricStatus?.isAvailable) {
          showToast({
            type: 'error',
            title: 'Biometric Not Available',
            message: 'Biometric authentication is not available on this device',
          });
          return { success: false, error: 'Not available' };
        }

        if (!biometricStatus?.isEnrolled) {
          showToast({
            type: 'warning',
            title: 'No Biometrics Enrolled',
            message: 'Please enroll biometrics in your device settings',
          });
          return { success: false, error: 'Not enrolled' };
        }

        if (!preferences?.enabled) {
          showToast({
            type: 'info',
            title: 'Biometric Disabled',
            message: 'Enable biometric authentication in settings',
          });
          return { success: false, error: 'Disabled by user' };
        }

        const result = await biometricService.authenticate(config);

        if (result.success) {
          showToast({
            type: 'success',
            title: 'Authentication Successful',
            message: 'Biometric authentication completed',
          });
        } else {
          showToast({
            type: 'error',
            title: 'Authentication Failed',
            message: result.error || 'Biometric authentication failed',
          });
        }

        return result;
      } catch (error) {
        console.error('Authentication error:', error);
        showToast({
          type: 'error',
          title: 'Authentication Error',
          message: 'An unexpected error occurred',
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [biometricStatus, preferences, showToast]
  );

  const updatePreferences = useCallback(
    async (newPreferences: Partial<BiometricPreferences>): Promise<void> => {
      try {
        setIsLoading(true);
        const currentPrefs = preferences || (await biometricService.getPreferences());
        const updatedPrefs = { ...currentPrefs, ...newPreferences };

        await biometricService.savePreferences(updatedPrefs);
        setPreferences(updatedPrefs);

        showToast({
          type: 'success',
          title: 'Settings Updated',
          message: 'Biometric preferences saved successfully',
        });
      } catch (error) {
        console.error('Error updating preferences:', error);
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to save biometric preferences',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [preferences, showToast]
  );

  const isRecentAuthRequired = useCallback(async (): Promise<boolean> => {
    try {
      return await biometricService.isRecentAuthRequired();
    } catch (error) {
      console.error('Error checking recent auth:', error);
      return true;
    }
  }, []);

  const clearBiometricData = useCallback(async (): Promise<void> => {
    try {
      await biometricService.clearBiometricData();
      setPreferences(null);
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }, []);

  return {
    isLoading,
    biometricStatus,
    preferences,
    authenticate,
    updatePreferences,
    checkStatus,
    isRecentAuthRequired,
    clearBiometricData,
    isAvailable: biometricStatus?.isAvailable || false,
    isEnrolled: biometricStatus?.isEnrolled || false,
    isEnabled: preferences?.enabled || false,
    biometryType: biometricStatus?.biometryType,
  };
};
