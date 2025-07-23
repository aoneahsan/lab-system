export interface BiometricAuthConfig {
  reason?: string;
  fallbackTitle?: string;
  maxAttempts?: number;
  androidBiometryTitle?: string;
  androidBiometrySubtitle?: string;
  androidBiometryDescription?: string;
  androidBiometryNegativeButtonText?: string;
}

export interface BiometricEnrollmentStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometryType?: 'face' | 'fingerprint' | 'iris' | 'unknown';
  errorMessage?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface BiometricPreferences {
  enabled: boolean;
  fallbackToPassword: boolean;
  requireRecentAuth: boolean;
  recentAuthThresholdMinutes: number;
}

export const DEFAULT_BIOMETRIC_CONFIG: BiometricAuthConfig = {
  reason: 'Authenticate to access LabFlow',
  fallbackTitle: 'Use Password',
  maxAttempts: 3,
  androidBiometryTitle: 'LabFlow Authentication',
  androidBiometrySubtitle: 'Use your biometric to sign in',
  androidBiometryDescription: 'Place your finger on the sensor or look at the camera',
  androidBiometryNegativeButtonText: 'Use Password',
};

export const DEFAULT_BIOMETRIC_PREFERENCES: BiometricPreferences = {
  enabled: false,
  fallbackToPassword: true,
  requireRecentAuth: true,
  recentAuthThresholdMinutes: 5,
};