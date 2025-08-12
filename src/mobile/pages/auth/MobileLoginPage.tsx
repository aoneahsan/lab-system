import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Fingerprint, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { BiometricAuth } from 'capacitor-biometric-authentication';
import { storageHelpers, STORAGE_KEYS } from '@/services/unified-storage.service';
import { toast } from 'sonner';
import { EmailField, PasswordField, CheckboxField } from '@/components/form-fields';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

interface LoginFormData {
  email: string;
  password: string;
}

const MobileLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const checkBiometricAvailability = async () => {
    try {
      const result = await BiometricAuth.isAvailable();
      setBiometricAvailable(result || false);
    } catch (_error) {
      console.error('Biometric check failed:', _error);
    }
  };

  useEffect(() => {
    checkBiometricAvailability();
    
    const checkSavedCredentials = async () => {
      try {
        const biometricEnabled = await storageHelpers.getPreference<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);
        if (biometricEnabled && biometricAvailable) {
          handleBiometricLogin();
        }
      } catch (_error) {
        console.error('Failed to check saved credentials:', _error);
      }
    };
    
    checkSavedCredentials();
  }, [biometricAvailable, handleBiometricLogin]);

  const handleBiometricLogin = useCallback(async () => {
    try {
      const verified = await BiometricAuth.authenticate({
        reason: 'Access your lab results securely',
        cancelTitle: 'Use Password',
        fallbackTitle: 'Use Password',
      });

      if (verified.success) {
        // Get saved credentials
        const email = await storageHelpers.getSecure<string>('user_email');
        const token = await storageHelpers.getSecure<string>('auth_token');

        if (email && token) {
          // Restore session
          await login({ email, password: '' }); // Token-based auth
          navigate('/home');
        }
      }
    } catch (_error) {
      console.error('Biometric authentication failed:', _error);
      toast.error('Biometric authentication failed');
    }
  }, [login, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({ email: data.email, password: data.password });

      // Save credentials for biometric login
      await storageHelpers.setSecure('user_email', data.email);

      // Ask to enable biometric
      if (biometricAvailable) {
        await storageHelpers.setPreference(STORAGE_KEYS.BIOMETRIC_ENABLED, true);
      }

      navigate('/home');
    } catch (_error) {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Logo and header */}
      <div className="px-6 pt-12 pb-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">LF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LabFlow</h1>
          <p className="text-gray-600 mt-2">Your Health Results, Anytime</p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {biometricAvailable && (
            <button
              type="button"
              onClick={handleBiometricLogin}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
            >
              <Fingerprint className="h-5 w-5" />
              Sign in with Biometrics
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Contact your lab
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;
