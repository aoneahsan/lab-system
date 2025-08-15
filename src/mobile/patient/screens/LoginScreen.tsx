import React, { useState } from 'react';
import { Eye, EyeOff, Fingerprint, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { biometricAuth } from '@/services/biometric-auth.service';
import { toast } from 'react-hot-toast';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { signIn } = useAuthStore();

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const available = await biometricAuth.isAvailable();
      setBiometricAvailable(available);
    } catch (error) {
      console.log('Biometric not available:', error);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success('Login successful');
      onLoginSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      const result = await biometricAuth.authenticate('Please authenticate to continue');
      
      if (result.success) {
        // Try to get stored credentials and auto-login
        const storedUser = await biometricAuth.getStoredCredentials();
        if (storedUser) {
          await signIn(storedUser.email, storedUser.password);
          toast.success('Biometric login successful');
          onLoginSuccess();
        } else {
          toast.error('No stored credentials found');
        }
      } else {
        toast.error('Biometric authentication failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LabFlow Patient</h1>
          <p className="text-gray-600 mt-2">Access your lab results and appointments</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleEmailLogin}
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Sign In'
            )}
          </button>

          {/* Biometric Login */}
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
                onClick={handleBiometricLogin}
                disabled={isLoading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Fingerprint className="h-5 w-5" />
                <span>Use Biometric</span>
              </button>
            </>
          )}

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact your healthcare provider
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Secure Access</p>
            <p>Your data is protected with industry-standard security measures.</p>
          </div>
        </div>
      </div>
    </div>
  );
};