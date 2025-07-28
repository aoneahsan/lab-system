import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TestTube, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useOfflineStore } from '@/mobile/stores/offline.store';
import { Network } from '@capacitor/network';
import { toast } from '@/hooks/useToast';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

type LoginFormData = yup.InferType<typeof schema>;

const PhlebotomistLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { initializeDatabase, setOnlineStatus, isOnline } = useOfflineStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    initializeOfflineSupport();
  }, []);

  const initializeOfflineSupport = async () => {
    try {
      // Initialize offline database
      await initializeDatabase();

      // Check network status
      const status = await Network.getStatus();
      setOnlineStatus(status.connected);

      // Listen for network changes
      Network.addListener('networkStatusChange', (status) => {
        setOnlineStatus(status.connected);
        toast.info(status.connected ? 'Back online' : 'Working offline');
      });
    } catch (error) {
      console.error('Failed to initialize offline support:', error);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (!isOnline) {
        // In real app, would check cached credentials
        toast.error('Cannot login while offline');
        return;
      }

      await login(data.email, data.password);
      navigate('/home');
    } catch (error) {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Network Status Bar */}
      <div
        className={`${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        } text-white px-4 py-2 flex items-center justify-center gap-2`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Offline Mode</span>
          </>
        )}
      </div>

      {/* Logo and header */}
      <div className="px-6 pt-8 pb-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <TestTube className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LabFlow Phlebotomist</h1>
          <p className="text-gray-600 mt-2">Mobile Collection App</p>
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
            disabled={isLoading || !isOnline}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {!isOnline && (
            <p className="text-center text-sm text-red-600">
              Login requires an internet connection
            </p>
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

export default PhlebotomistLoginPage;
