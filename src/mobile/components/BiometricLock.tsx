import React, { useEffect, useState } from 'react';
import { Fingerprint, UserCheck, LockIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from 'capacitor-biometric-authentication';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { uiLogger } from '@/services/logger.service';

interface BiometricLockProps {
  onSuccess: () => void;
  reason?: string;
}

export const BiometricLock: React.FC<BiometricLockProps> = ({ 
  onSuccess, 
  reason = 'Authenticate to continue' 
}) => {
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'none'>('none');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if (!Capacitor.isNativePlatform()) {
      setBiometricType('none');
      return;
    }

    try {
      const { isAvailable, biometryType } = await BiometricAuth.checkBiometry();
      if (isAvailable) {
        setBiometricType(biometryType === 'face' ? 'face' : 'fingerprint');
      }
    } catch (error) {
      uiLogger.error('Biometric check failed:', error);
      setBiometricType('none');
    }
  };

  const authenticate = async () => {
    if (!Capacitor.isNativePlatform()) {
      // For web, just simulate success after a delay
      setIsAuthenticating(true);
      setTimeout(() => {
        setIsAuthenticating(false);
        onSuccess();
      }, 1000);
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await BiometricAuth.authenticate({
        reason,
        fallbackButtonTitle: 'Use Passcode',
        maxAttempts: 3,
      });

      if (result.success) {
        onSuccess();
      } else {
        toast.error('Authentication Failed', 'Please try again');
      }
    } catch (error) {
      uiLogger.error('Biometric authentication failed:', error);
      toast.error('Authentication Error', 'Unable to authenticate');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const BiometricIcon = biometricType === 'face' ? UserCheck : Fingerprint;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* App Icon */}
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LockIcon className="w-10 h-10 text-indigo-600" />
          </div>

          {/* User Info */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {currentUser?.displayName?.split(' ')[0]}
          </h2>
          <p className="text-gray-600 mb-8">{reason}</p>

          {/* Biometric Button */}
          <button
            onClick={authenticate}
            disabled={isAuthenticating}
            className="w-full bg-indigo-600 text-white rounded-lg py-4 flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isAuthenticating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <BiometricIcon className="w-6 h-6" />
                <span>
                  {biometricType === 'face' 
                    ? 'Use Face ID' 
                    : biometricType === 'fingerprint'
                    ? 'Use Touch ID'
                    : 'Authenticate'
                  }
                </span>
              </>
            )}
          </button>

          {/* Alternative Options */}
          <div className="mt-6 space-y-2">
            <button className="text-sm text-gray-600 hover:text-gray-800">
              Use passcode instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};