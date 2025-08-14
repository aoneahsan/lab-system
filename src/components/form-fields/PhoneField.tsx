import React, { useState, useCallback, useRef } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';

interface PhoneFieldProps extends BaseFormFieldProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  defaultCountry?: string;
  international?: boolean;
  withCountryCallingCode?: boolean;
  countrySelectProps?: any;
  placeholder?: string;
  autoFocus?: boolean;
}

// Custom input component to prevent re-renders
const PhoneInputComponent = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  return <input {...props} ref={ref} className="PhoneInputInput pl-10" />;
});
PhoneInputComponent.displayName = 'PhoneInputComponent';

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label = 'Phone Number',
  name,
  value = '',
  onChange,
  defaultCountry = 'PK',
  international = true,
  withCountryCallingCode = true,
  countrySelectProps,
  placeholder = 'Enter phone number',
  autoFocus = false,
  error,
  required = false,
  disabled = false,
  loading = false,
  helpText,
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  showLabel = true,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Use a stable callback to prevent re-renders
  const handleChange = useCallback((newValue: string | undefined) => {
    setLocalValue(newValue || '');
    if (touched && newValue) {
      if (!isValidPhoneNumber(newValue)) {
        setLocalError('Please enter a valid phone number');
      } else {
        setLocalError('');
      }
    }
    onChange?.(newValue);
  }, [touched, onChange]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (localValue && !isValidPhoneNumber(localValue)) {
      setLocalError('Please enter a valid phone number');
    } else {
      setLocalError('');
    }
  }, [localValue]);

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
      <div className="phone-input-wrapper relative">
        <style>{`
          .phone-input-wrapper .PhoneInput {
            position: relative;
          }
          
          .phone-input-wrapper .PhoneInputInput {
            width: 100%;
            padding: 0.5rem 0.75rem 0.5rem 2.5rem;
            border: 1px solid ${displayError ? '#ef4444' : '#d1d5db'};
            border-radius: 0.375rem;
            background-color: white;
            color: #111827;
            font-size: 0.875rem;
            line-height: 1.25rem;
            transition: all 0.2s;
          }
          
          .dark .phone-input-wrapper .PhoneInputInput {
            background-color: #374151;
            border-color: ${displayError ? '#dc2626' : '#4b5563'};
            color: white;
          }
          
          .phone-input-wrapper .PhoneInputInput:focus {
            outline: none;
            ring: 2px;
            ring-color: ${displayError ? '#ef4444' : '#3b82f6'};
            border-color: ${displayError ? '#ef4444' : '#3b82f6'};
          }
          
          .phone-input-wrapper .PhoneInputInput:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #f3f4f6;
          }
          
          .dark .phone-input-wrapper .PhoneInputInput:disabled {
            background-color: #1f2937;
          }
          
          .phone-input-wrapper .PhoneInputCountry {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            padding-left: 0.75rem;
            z-index: 1;
          }
          
          .phone-input-wrapper .PhoneInputCountryIcon {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.5rem;
          }
          
          .phone-input-wrapper .PhoneInputCountrySelect {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }
          
          .phone-input-wrapper .PhoneInputCountrySelectArrow {
            margin-left: 0.25rem;
            color: #6b7280;
          }
          
          .dark .phone-input-wrapper .PhoneInputCountrySelectArrow {
            color: #9ca3af;
          }
        `}</style>
        
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-0">
          <PhoneIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <PhoneInput
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          defaultCountry={defaultCountry as any}
          international={international}
          withCountryCallingCode={withCountryCallingCode}
          countrySelectProps={countrySelectProps}
          placeholder={placeholder}
          disabled={disabled || loading}
          autoFocus={autoFocus}
          inputComponent={PhoneInputComponent}
        />
      </div>
    </FormFieldWrapper>
  );
};