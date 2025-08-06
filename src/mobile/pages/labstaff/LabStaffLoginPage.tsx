import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Microscope, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { BiometricAuth } from 'capacitor-biometric-authentication';
import { toast } from '@/hooks/useToast';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

type LoginFormData = yup.InferType<typeof schema>;

const LabStaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema) as any,
  });

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const result = await BiometricAuth.isAvailable();
      setBiometricAvailable(result || false);
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({ email: data.email, password: data.password });
      navigate('/home');
    } catch (error) {
      toast.error('Invalid email or password');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const verified = await BiometricAuth.authenticate({
        reason: 'Access lab systems securely',
        cancelTitle: 'Use Password',
        fallbackTitle: 'Use Password',
      });

      if (verified.success) {
        // In real app, would use stored credentials or token
        const storedEmail = localStorage.getItem('labStaffEmail');
        if (storedEmail) {
          // Mock successful biometric auth
          navigate('/home');
        } else {
          toast.error('Please login with email first to enable biometric login');
        }
      }
    } catch (error) {
      toast.error('Biometric authentication failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Logo and header */}
      <div className="px-6 pt-12 pb-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Microscope className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LabFlow Lab Staff</h1>
          <p className="text-gray-600 mt-2">Laboratory Management System</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {biometricAvailable && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBiometricLogin}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center gap-2"
              >
                <Fingerprint className="h-5 w-5" />
                Sign in with Biometrics
              </button>
            </>
          )}
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Having trouble?{' '}
            <a href="tel:+1234567890" className="font-medium text-purple-600 hover:text-purple-500">
              Call IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LabStaffLoginPage;
