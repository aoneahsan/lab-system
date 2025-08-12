import React from 'react';
import Select, { SingleValue, MultiValue, StylesConfig } from 'react-select';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';

export interface SelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface SelectFieldProps extends BaseFormFieldProps {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[] | null) => void;
  isMulti?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  placeholder?: string;
  noOptionsMessage?: string;
  isLoading?: boolean;
  menuPlacement?: 'auto' | 'bottom' | 'top';
  closeMenuOnSelect?: boolean;
  autoFocus?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  isMulti = false,
  isSearchable = true,
  isClearable = true,
  placeholder = 'Select...',
  noOptionsMessage = 'No options',
  isLoading = false,
  menuPlacement = 'auto',
  closeMenuOnSelect = !isMulti,
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
  const customStyles: StylesConfig<SelectOption, boolean> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--select-bg, white)',
      borderColor: error 
        ? 'var(--select-error-border, #ef4444)' 
        : state.isFocused 
        ? 'var(--select-focus-border, #3b82f6)' 
        : 'var(--select-border, #d1d5db)',
      boxShadow: state.isFocused ? '0 0 0 2px var(--select-focus-ring, rgba(59, 130, 246, 0.1))' : 'none',
      '&:hover': {
        borderColor: error 
          ? 'var(--select-error-border, #ef4444)' 
          : 'var(--select-hover-border, #9ca3af)',
      },
      minHeight: '38px',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--select-menu-bg, white)',
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: 'var(--select-menu-bg, white)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'var(--select-option-selected-bg, #3b82f6)'
        : state.isFocused
        ? 'var(--select-option-hover-bg, #f3f4f6)'
        : 'transparent',
      color: state.isSelected
        ? 'var(--select-option-selected-color, white)'
        : 'var(--select-option-color, #111827)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--select-option-active-bg, #e5e7eb)',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--select-text, #111827)',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'var(--select-multivalue-bg, #e5e7eb)',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'var(--select-multivalue-text, #111827)',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'var(--select-multivalue-remove, #6b7280)',
      '&:hover': {
        backgroundColor: 'var(--select-multivalue-remove-hover-bg, #d1d5db)',
        color: 'var(--select-multivalue-remove-hover, #111827)',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--select-placeholder, #9ca3af)',
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--select-input, #111827)',
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: 'var(--select-indicator, #d1d5db)',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'var(--select-indicator, #6b7280)',
      '&:hover': {
        color: 'var(--select-indicator-hover, #4b5563)',
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: 'var(--select-indicator, #6b7280)',
      '&:hover': {
        color: 'var(--select-indicator-hover, #4b5563)',
      },
    }),
  };

  const getSelectedValue = () => {
    if (isMulti) {
      const values = Array.isArray(value) ? value : [];
      return options.filter(opt => values.includes(opt.value));
    } else {
      return options.find(opt => opt.value === value) || null;
    }
  };

  const handleChange = (
    newValue: SingleValue<SelectOption> | MultiValue<SelectOption>
  ) => {
    if (!onChange) return;

    if (isMulti) {
      const values = (newValue as MultiValue<SelectOption>).map(opt => opt.value);
      onChange(values);
    } else {
      const singleValue = newValue as SingleValue<SelectOption>;
      onChange(singleValue ? singleValue.value : null);
    }
  };

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={disabled}
      loading={loading || isLoading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <style>{`
        :root {
          --select-bg: white;
          --select-border: #d1d5db;
          --select-hover-border: #9ca3af;
          --select-focus-border: #3b82f6;
          --select-focus-ring: rgba(59, 130, 246, 0.1);
          --select-error-border: #ef4444;
          --select-menu-bg: white;
          --select-option-color: #111827;
          --select-option-hover-bg: #f3f4f6;
          --select-option-active-bg: #e5e7eb;
          --select-option-selected-bg: #3b82f6;
          --select-option-selected-color: white;
          --select-text: #111827;
          --select-placeholder: #9ca3af;
          --select-input: #111827;
          --select-indicator: #6b7280;
          --select-indicator-hover: #4b5563;
          --select-multivalue-bg: #e5e7eb;
          --select-multivalue-text: #111827;
          --select-multivalue-remove: #6b7280;
          --select-multivalue-remove-hover-bg: #d1d5db;
          --select-multivalue-remove-hover: #111827;
        }
        
        .dark {
          --select-bg: #374151;
          --select-border: #4b5563;
          --select-hover-border: #6b7280;
          --select-focus-border: #3b82f6;
          --select-focus-ring: rgba(59, 130, 246, 0.2);
          --select-error-border: #dc2626;
          --select-menu-bg: #374151;
          --select-option-color: white;
          --select-option-hover-bg: #4b5563;
          --select-option-active-bg: #6b7280;
          --select-option-selected-bg: #3b82f6;
          --select-option-selected-color: white;
          --select-text: white;
          --select-placeholder: #9ca3af;
          --select-input: white;
          --select-indicator: #9ca3af;
          --select-indicator-hover: #d1d5db;
          --select-multivalue-bg: #4b5563;
          --select-multivalue-text: white;
          --select-multivalue-remove: #d1d5db;
          --select-multivalue-remove-hover-bg: #6b7280;
          --select-multivalue-remove-hover: white;
        }
      `}</style>
      
      <Select
        inputId={name}
        name={name}
        options={options}
        value={getSelectedValue()}
        onChange={handleChange}
        isMulti={isMulti}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isDisabled={disabled || loading || isLoading}
        isLoading={loading || isLoading}
        placeholder={placeholder}
        noOptionsMessage={() => noOptionsMessage}
        menuPlacement={menuPlacement}
        closeMenuOnSelect={closeMenuOnSelect}
        autoFocus={autoFocus}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </FormFieldWrapper>
  );
};