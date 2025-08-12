import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { BaseFormFieldProps, FormFieldWrapper, getInputClassName } from './BaseFormField';

interface TextFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  type?: 'text' | 'url';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  placeholder = '',
  type = 'text',
  maxLength,
  minLength,
  pattern,
  autoComplete,
  autoFocus = false,
  readOnly = false,
  value,
  onChange,
  onBlur,
  register,
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
  const inputProps = register || {
    name,
    onChange,
    onBlur,
  };

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
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        disabled={disabled || loading}
        value={value}
        className={getInputClassName(className, error, disabled)}
        {...inputProps}
      />
    </FormFieldWrapper>
  );
};