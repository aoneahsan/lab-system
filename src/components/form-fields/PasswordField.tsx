import React, { useState, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { BaseFormFieldProps, FormFieldWrapper, getInputClassName } from './BaseFormField';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import PasswordStrengthBar from 'react-password-strength-bar';

interface PasswordFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  showStrength?: boolean;
  minLength?: number;
  confirmPasswordValue?: string;
  isConfirmPassword?: boolean;
  originalPasswordValue?: string;
  validateOnChange?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label = 'Password',
  name,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  autoFocus = false,
  value,
  onChange,
  onBlur,
  register,
  showStrength = false,
  minLength = 8,
  confirmPasswordValue,
  isConfirmPassword = false,
  originalPasswordValue,
  validateOnChange = true,
  error,
  required = false,
  disabled = false,
  loading = false,
  helpText = showStrength ? 'Use at least 8 characters, including uppercase, lowercase, numbers, and symbols' : undefined,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  showLabel = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const validatePassword = (password: string) => {
    if (!password && required) {
      return 'Password is required';
    }
    
    if (password && password.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }

    if (showStrength && password) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
      if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
      if (!hasNumbers) return 'Password must contain at least one number';
      if (!hasSpecialChar) return 'Password must contain at least one special character';
    }

    if (isConfirmPassword && originalPasswordValue && password !== originalPasswordValue) {
      return 'Passwords do not match';
    }

    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (validateOnChange && !register) {
      const validationError = validatePassword(newValue);
      setLocalError(validationError);
    }
    
    onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!register) {
      const validationError = validatePassword(e.target.value);
      setLocalError(validationError);
    }
    onBlur?.(e);
  };

  const inputProps = register || {
    name,
    onChange: handleChange,
    onBlur: handleBlur,
    value: localValue,
  };

  const displayError = error || localError;

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={displayError}
      required={required}
      disabled={disabled}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <LockClosedIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled || loading}
          className={getInputClassName(`pl-10 pr-10 ${className}`, displayError, disabled)}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          )}
        </button>
      </div>
      {showStrength && localValue && !isConfirmPassword && (
        <PasswordStrengthBar 
          password={localValue}
          minLength={minLength}
          scoreWords={['weak', 'fair', 'good', 'strong', 'excellent']}
          shortScoreWord="too short"
        />
      )}
    </FormFieldWrapper>
  );
};

export const ConfirmPasswordField: React.FC<Omit<PasswordFieldProps, 'isConfirmPassword'>> = (props) => {
  return (
    <PasswordField
      {...props}
      label={props.label || 'Confirm Password'}
      autoComplete="new-password"
      isConfirmPassword={true}
      showStrength={false}
      helpText={props.helpText || 'Re-enter your password to confirm'}
    />
  );
};