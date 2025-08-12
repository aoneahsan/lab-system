import React, { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import validator from 'validator';
import { BaseFormFieldProps, FormFieldWrapper, getInputClassName } from './BaseFormField';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

interface EmailFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  validateOnBlur?: boolean;
  customValidation?: (email: string) => string | undefined;
}

export const EmailField: React.FC<EmailFieldProps> = ({
  label = 'Email Address',
  name,
  placeholder = 'you@example.com',
  autoComplete = 'email',
  autoFocus = false,
  value,
  onChange,
  onBlur,
  register,
  validateOnBlur = true,
  customValidation,
  error,
  required = false,
  disabled = false,
  loading = false,
  helpText,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  showLabel = true,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string) => {
    if (!email && required) {
      return 'Email is required';
    }
    if (email && !validator.isEmail(email)) {
      return 'Please enter a valid email address';
    }
    if (customValidation) {
      return customValidation(email);
    }
    return '';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (validateOnBlur && !register) {
      const validationError = validateEmail(e.target.value);
      setLocalError(validationError);
    }
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (touched && validateOnBlur && !register) {
      const validationError = validateEmail(e.target.value);
      setLocalError(validationError);
    }
    onChange?.(e);
  };

  const inputProps = register || {
    name,
    onChange: handleChange,
    onBlur: handleBlur,
    value,
  };

  const displayError = error || (touched ? localError : '');

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
          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={name}
          type="email"
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled || loading}
          className={getInputClassName(`pl-10 ${className}`, displayError, disabled)}
          {...inputProps}
        />
      </div>
    </FormFieldWrapper>
  );
};