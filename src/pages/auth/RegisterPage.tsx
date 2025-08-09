import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { CheckCircle, XCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    tenantCode: '',
    acceptTerms: false,
  });
  const [tenantValidation, setTenantValidation] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isValid: null,
    message: '',
  });

  // Check tenant code validity
  useEffect(() => {
    const checkTenantCode = async () => {
      if (!formData.tenantCode || formData.tenantCode.length < 2) {
        setTenantValidation({
          isChecking: false,
          isValid: null,
          message: '',
        });
        return;
      }

      setTenantValidation({
        isChecking: true,
        isValid: null,
        message: 'Checking laboratory code...',
      });

      try {
        const tenantDoc = await getDoc(
          doc(firestore, 'tenants', formData.tenantCode.toLowerCase())
        );

        if (tenantDoc.exists()) {
          const tenantData = tenantDoc.data();
          setTenantValidation({
            isChecking: false,
            isValid: true,
            message: `✓ ${tenantData.name}`,
          });
        } else {
          setTenantValidation({
            isChecking: false,
            isValid: false,
            message: 'Invalid laboratory code. Please check and try again.',
          });
        }
      } catch (_error) {
        setTenantValidation({
          isChecking: false,
          isValid: false,
          message: 'Error validating code. Please try again.',
        });
      }
    };

    const timeoutId = setTimeout(checkTenantCode, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.tenantCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only validate tenant code if one was provided
    if (formData.tenantCode && !tenantValidation.isValid) {
      toast.error('Invalid laboratory code', 'Please enter a valid laboratory code or leave empty');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password mismatch', 'Passwords do not match');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Terms required', 'Please accept the terms and conditions');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        tenantCode: formData.tenantCode || undefined, // Pass undefined if no tenant code
      });

      toast.success('Registration successful', 'Welcome to LabFlow!');
      
      // Navigate to onboarding if no tenant code, otherwise to dashboard
      if (!formData.tenantCode) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to create account';
      toast.error('Registration failed', errorMessage);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return null;

    let strength = 0;
    const requirements = [];

    if (password.length >= 8) {
      strength++;
    } else {
      requirements.push('At least 8 characters');
    }

    if (/[A-Z]/.test(password)) {
      strength++;
    } else {
      requirements.push('One uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      strength++;
    } else {
      requirements.push('One lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      strength++;
    } else {
      requirements.push('One number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength++;
    } else {
      requirements.push('One special character');
    }

    return { strength, requirements };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create your account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              required
              className="input"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="label">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              required
              className="input"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="label">
            Phone number (optional)
          </label>
          <input
            id="phoneNumber"
            type="tel"
            className="input"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="tenantCode" className="label">
            Laboratory code (optional)
          </label>
          <div className="relative">
            <input
              id="tenantCode"
              type="text"
              className={`input pr-10 ${
                formData.tenantCode && !tenantValidation.isChecking
                  ? tenantValidation.isValid
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : ''
              }`}
              value={formData.tenantCode}
              onChange={(e) =>
                setFormData({ ...formData, tenantCode: e.target.value.toUpperCase() })
              }
              placeholder="Enter DEMO or leave empty to create new"
            />
            {formData.tenantCode && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {tenantValidation.isChecking ? (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                ) : tenantValidation.isValid === true ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : tenantValidation.isValid === false ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            )}
          </div>
          {tenantValidation.message && (
            <p
              className={`mt-1 text-sm ${
                tenantValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {tenantValidation.message}
            </p>
          )}
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Leave empty to create a new laboratory after registration, or use <span className="font-semibold">DEMO</span> for testing
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="input"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={8}
          />
          {formData.password &&
            (() => {
              const passwordInfo = getPasswordStrength();
              if (!passwordInfo) return null;

              return (
                <>
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i < passwordInfo.strength
                              ? passwordInfo.strength <= 2
                                ? 'bg-red-500'
                                : passwordInfo.strength <= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        passwordInfo.strength <= 2
                          ? 'text-red-600'
                          : passwordInfo.strength <= 3
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {passwordInfo.strength <= 2
                        ? 'Weak password'
                        : passwordInfo.strength <= 3
                          ? 'Medium password'
                          : 'Strong password'}
                    </p>
                  </div>
                  {passwordInfo.requirements.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Needs: {passwordInfo.requirements.join(', ')}
                    </p>
                  )}
                </>
              );
            })()}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              required
              className={`input pr-10 ${
                formData.confirmPassword && formData.password
                  ? formData.confirmPassword === formData.password
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : ''
              }`}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            {formData.confirmPassword && formData.password && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {formData.confirmPassword === formData.password ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          {formData.confirmPassword &&
            formData.password &&
            formData.confirmPassword !== formData.password && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
        </div>

        <div className="flex items-center">
          <input
            id="acceptTerms"
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            checked={formData.acceptTerms}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
          />
          <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            I accept the{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              terms and conditions
            </a>
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="w-full btn btn-primary">
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="loading-spinner mr-2"></span>
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
