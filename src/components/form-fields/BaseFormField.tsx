import React from 'react';
import { FieldError } from 'react-hook-form';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export interface BaseFormFieldProps {
  label?: string;
  name: string;
  error?: FieldError | string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helpText?: string;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  showLabel?: boolean;
}

interface FormFieldWrapperProps extends BaseFormFieldProps {
  children: React.ReactNode;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  name,
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
  children,
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className={`form-field-wrapper ${containerClassName}`}>
      {showLabel && label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={`relative ${loading ? 'opacity-50' : ''}`}>
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      {helpText && !errorMessage && (
        <div className="mt-1 flex items-start text-sm text-gray-500 dark:text-gray-400">
          <InformationCircleIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{helpText}</span>
        </div>
      )}

      {errorMessage && (
        <p className={`mt-1 text-sm text-red-600 dark:text-red-400 ${errorClassName}`}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export const getInputClassName = (
  baseClassName = '',
  error?: FieldError | string,
  disabled = false
) => {
  const classes = [
    'w-full',
    'px-3',
    'py-2',
    'border',
    'rounded-md',
    'bg-white dark:bg-gray-700',
    'text-gray-900 dark:text-white',
    'placeholder-gray-500 dark:placeholder-gray-400',
    'focus:outline-none',
    'focus:ring-2',
    'transition-colors',
    'duration-200',
  ];

  if (error) {
    classes.push(
      'border-red-300 dark:border-red-600',
      'focus:ring-red-500',
      'focus:border-red-500'
    );
  } else {
    classes.push(
      'border-gray-300 dark:border-gray-600',
      'focus:ring-primary-500',
      'focus:border-primary-500'
    );
  }

  if (disabled) {
    classes.push('opacity-50', 'cursor-not-allowed', 'bg-gray-100 dark:bg-gray-800');
  }

  return `${classes.join(' ')} ${baseClassName}`.trim();
};