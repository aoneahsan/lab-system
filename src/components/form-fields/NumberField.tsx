import React, { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { BaseFormFieldProps, FormFieldWrapper, getInputClassName } from './BaseFormField';

interface NumberFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number | undefined) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  allowDecimals?: boolean;
  prefix?: string;
  suffix?: string;
  thousandSeparator?: boolean;
  autoFocus?: boolean;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  name,
  placeholder = '',
  min,
  max,
  step = 1,
  value,
  onChange,
  onBlur,
  register,
  allowDecimals = false,
  prefix,
  suffix,
  thousandSeparator = false,
  autoFocus = false,
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
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
  const [localError, setLocalError] = useState<string>('');

  const formatNumber = (num: number): string => {
    if (thousandSeparator) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  const parseNumber = (str: string): number | undefined => {
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const num = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
    return isNaN(num) ? undefined : num;
  };

  const validateNumber = (num: number | undefined): string => {
    if (num === undefined && required) {
      return 'This field is required';
    }
    if (num !== undefined) {
      if (min !== undefined && num < min) {
        return `Value must be at least ${min}`;
      }
      if (max !== undefined && num > max) {
        return `Value must be at most ${max}`;
      }
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    
    const numValue = parseNumber(inputValue);
    const validationError = validateNumber(numValue);
    setLocalError(validationError);
    
    if (!register && onChange) {
      onChange(numValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const numValue = parseNumber(e.target.value);
    const validationError = validateNumber(numValue);
    setLocalError(validationError);
    
    if (numValue !== undefined && thousandSeparator) {
      setLocalValue(formatNumber(numValue));
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
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400">{prefix}</span>
          </div>
        )}
        <input
          id={name}
          type="number"
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          disabled={disabled || loading}
          className={getInputClassName(
            `${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${className}`,
            displayError,
            disabled
          )}
          {...inputProps}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400">{suffix}</span>
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
};

export const AgeField: React.FC<Omit<NumberFieldProps, 'min' | 'max' | 'suffix'>> = (props) => {
  return (
    <NumberField
      {...props}
      label={props.label || 'Age'}
      min={0}
      max={150}
      suffix="years"
      helpText={props.helpText || 'Enter age between 0 and 150'}
    />
  );
};

export const PercentageField: React.FC<Omit<NumberFieldProps, 'min' | 'max' | 'suffix'>> = (props) => {
  return (
    <NumberField
      {...props}
      label={props.label || 'Percentage'}
      min={0}
      max={100}
      suffix="%"
      allowDecimals={true}
      step={0.01}
    />
  );
};

export const CurrencyField: React.FC<Omit<NumberFieldProps, 'prefix' | 'thousandSeparator'>> = (props) => {
  return (
    <NumberField
      {...props}
      label={props.label || 'Amount'}
      prefix="$"
      thousandSeparator={true}
      allowDecimals={true}
      step={0.01}
      min={0}
    />
  );
};