import React, { useEffect, useState, useMemo } from 'react';
import { CountrySelect, StateSelect, CitySelect } from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { pakistanCities, getCitiesForState } from '@/utils/city-data-pakistan';
import { Select } from '@/components/ui/Select';

interface CountryFieldProps extends BaseFormFieldProps {
  value?: any;
  onChange?: (value: any) => void;
  onStateChange?: (value: any) => void;
  onCityChange?: (value: any) => void;
  placeholder?: string;
  showFlag?: boolean;
  onCountryNameChange?: (name: string) => void;
}

export const CountryField: React.FC<CountryFieldProps> = ({
  label = 'Country',
  name,
  value,
  onChange,
  placeholder = 'Select Country',
  showFlag = true,
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
  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={disabled}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <style>{`
        .rcsc-country-dropdown,
        .rcsc-state-dropdown,
        .rcsc-city-dropdown {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid ${error ? '#ef4444' : '#d1d5db'};
          border-radius: 0.375rem;
          background-color: white;
          color: #111827;
          font-size: 0.875rem;
          line-height: 1.25rem;
          transition: all 0.2s;
        }
        
        .dark .rcsc-country-dropdown,
        .dark .rcsc-state-dropdown,
        .dark .rcsc-city-dropdown {
          background-color: #374151;
          border-color: ${error ? '#dc2626' : '#4b5563'};
          color: white;
        }
        
        .rcsc-country-dropdown:focus,
        .rcsc-state-dropdown:focus,
        .rcsc-city-dropdown:focus {
          outline: none;
          ring: 2px;
          ring-color: ${error ? '#ef4444' : '#3b82f6'};
          border-color: ${error ? '#ef4444' : '#3b82f6'};
        }
        
        .rcsc-country-dropdown:disabled,
        .rcsc-state-dropdown:disabled,
        .rcsc-city-dropdown:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: #f3f4f6;
        }
        
        .dark .rcsc-country-dropdown:disabled,
        .dark .rcsc-state-dropdown:disabled,
        .dark .rcsc-city-dropdown:disabled {
          background-color: #1f2937;
        }
        
        .rcsc-dropdown-search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
        }
        
        .dark .rcsc-dropdown-search-input {
          background-color: #374151;
          border-color: #4b5563;
          color: white;
        }
        
        .rcsc-dropdown-list {
          max-height: 200px;
          overflow-y: auto;
        }
        
        .rcsc-dropdown-option {
          padding: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .rcsc-dropdown-option:hover {
          background-color: #f3f4f6;
        }
        
        .dark .rcsc-dropdown-option:hover {
          background-color: #4b5563;
        }
        
        .rcsc-dropdown-option-selected {
          background-color: #3b82f6;
          color: white;
        }
      `}</style>
      
      <CountrySelect
        onChange={onChange}
        defaultValue={value}
        containerClassName=""
        inputClassName=""
        placeHolder={placeholder}
        showFlag={showFlag}
      />
    </FormFieldWrapper>
  );
};

interface StateFieldProps extends BaseFormFieldProps {
  countryId: number | undefined;
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  onStateNameChange?: (name: string) => void;
}

export const StateField: React.FC<StateFieldProps> = ({
  label = 'State/Province',
  name,
  countryId,
  value,
  onChange,
  placeholder = 'Select State',
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
  const isDisabled = disabled || loading || !countryId;
  
  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={isDisabled}
      loading={loading}
      helpText={helpText || (!countryId ? 'Please select a country first' : undefined)}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <StateSelect
        countryid={countryId}
        onChange={onChange}
        defaultValue={value}
        containerClassName=""
        inputClassName=""
        placeHolder={placeholder}
      />
    </FormFieldWrapper>
  );
};

interface CityFieldProps extends BaseFormFieldProps {
  countryId: number | undefined;
  stateId: number | undefined;
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  countryName?: string;
  stateName?: string;
}

export const CityField: React.FC<CityFieldProps> = ({
  label = 'City',
  name,
  countryId,
  stateId,
  value,
  onChange,
  placeholder = 'Select City',
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
  const [countryName, setCountryName] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  
  // Check if we should use Pakistani cities data
  const usePakistanData = useMemo(() => {
    return countryName?.toLowerCase().includes('pakistan');
  }, [countryName]);
  
  // Get Pakistani cities if applicable
  const pakistaniCities = useMemo(() => {
    if (usePakistanData && stateName) {
      // Try to match state name with our data
      const normalizedStateName = stateName.replace(/Province|Territory/gi, '').trim();
      return getCitiesForState(normalizedStateName);
    }
    return [];
  }, [usePakistanData, stateName]);
  
  const isDisabled = disabled || loading || !countryId || !stateId;
  
  // Use custom select for Pakistani cities
  if (usePakistanData && pakistaniCities.length > 0) {
    return (
      <FormFieldWrapper
        label={label}
        name={name}
        error={error}
        required={required}
        disabled={isDisabled}
        loading={loading}
        helpText={helpText}
        containerClassName={containerClassName}
        labelClassName={labelClassName}
        errorClassName={errorClassName}
        showLabel={showLabel}
      >
        <Select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={isDisabled}
          className={error ? 'border-red-500' : ''}
        >
          <option value="">{placeholder}</option>
          {pakistaniCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
      </FormFieldWrapper>
    );
  }
  
  // Fall back to default CitySelect for other countries
  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={isDisabled}
      loading={loading}
      helpText={helpText || (!stateId ? 'Please select a state first' : undefined)}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <CitySelect
        countryid={countryId}
        stateid={stateId}
        onChange={onChange}
        defaultValue={value}
        containerClassName=""
        inputClassName=""
        placeHolder={placeholder}
      />
    </FormFieldWrapper>
  );
};