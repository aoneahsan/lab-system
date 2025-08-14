import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { EmailField, PasswordField, CheckboxField } from '@/components/form-fields';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithBiometric, isLoading, firebaseUser } = useAuthStore();
  const { isEnabled: isBiometricEnabled } = useBiometricAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  // Check if user can use biometric (has a saved session)
  const canUseBiometric = firebaseUser && isBiometricEnabled;

  useEffect(() => {
    // Auto-prompt for biometric if available and user has a session
    if (canUseBiometric) {
      handleBiometricLogin();
    }
  }, []);  

  const handleBiometricLogin = async () => {
    if (!canUseBiometric) return;

    try {
      setIsAuthenticatingBiometric(true);
      const result = await loginWithBiometric();

      if (result.success) {
        toast.success('Login successful', 'Welcome back to LabFlow!');
        // Redirect based on user role
        const user = useAuthStore.getState().currentUser;
        navigate(user?.role === 'super_admin' ? '/admin' : '/dashboard');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
    } finally {
      setIsAuthenticatingBiometric(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      toast.success('Login successful', 'Welcome back to LabFlow!');
      // Redirect based on user role
      const user = useAuthStore.getState().currentUser;
      navigate(user?.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
      toast.error('Login failed', errorMessage);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Sign in to your account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <EmailField
          label="Email address"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          autoFocus
        />
        
        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          autoComplete="current-password"
        />
        
        <div className="flex items-center justify-between">
          <CheckboxField
            label="Remember me"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
          />
          
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading || isAuthenticatingBiometric}
          className="w-full btn btn-primary"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="loading-spinner mr-2"></span>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Biometric Login Option */}
      {canUseBiometric && (
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isAuthenticatingBiometric || isLoading}
            className="mt-4 w-full btn btn-secondary flex items-center justify-center gap-2"
          >
            {isAuthenticatingBiometric ? (
              <>
                <span className="loading-spinner"></span>
                Authenticating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
                Sign in with Biometric
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
