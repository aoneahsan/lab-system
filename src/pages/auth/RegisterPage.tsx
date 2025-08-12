import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  TextField,
  EmailField,
  PhoneField,
  PasswordField,
  ConfirmPasswordField,
  CheckboxField,
} from '@/components/form-fields';

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
          <TextField
            label="First name"
            name="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          
          <TextField
            label="Last name"
            name="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>

        <EmailField
          label="Email address"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        
        <PhoneField
          label="Phone number (optional)"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={(value) => setFormData({ ...formData, phoneNumber: value || '' })}
        />

        <TextField
          label="Laboratory code (optional)"
          name="tenantCode"
          value={formData.tenantCode}
          onChange={(e) => setFormData({ ...formData, tenantCode: e.target.value.toUpperCase() })}
          placeholder="Enter DEMO or leave empty to create new"
          error={tenantValidation.isValid === false ? tenantValidation.message : undefined}
          helpText="Leave empty to create a new laboratory after registration, or use DEMO for testing"
        />

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          showStrength
          minLength={8}
          autoComplete="new-password"
        />

        <ConfirmPasswordField
          label="Confirm password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          originalPasswordValue={formData.password}
          required
        />

        <CheckboxField
          label="I accept the terms and conditions"
          name="acceptTerms"
          checked={formData.acceptTerms}
          onChange={(checked) => setFormData({ ...formData, acceptTerms: checked })}
        />

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
