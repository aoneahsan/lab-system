import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { BaseFormFieldProps, FormFieldWrapper, getInputClassName } from './BaseFormField';

interface TextareaFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
  readOnly?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  register?: UseFormRegisterReturn;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  showCharCount?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  placeholder = '',
  rows = 4,
  maxLength,
  minLength,
  autoFocus = false,
  readOnly = false,
  value,
  onChange,
  onBlur,
  register,
  resize = 'vertical',
  showCharCount = false,
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
  const [charCount, setCharCount] = React.useState(value?.length || 0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  const inputProps = register || {
    name,
    onChange: handleChange,
    onBlur,
    value,
  };

  const resizeClass = {
    none: 'resize-none',
    both: 'resize',
    horizontal: 'resize-x',
    vertical: 'resize-y',
  }[resize];

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
      <div className="relative">
        <textarea
          id={name}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          minLength={minLength}
          autoFocus={autoFocus}
          readOnly={readOnly}
          disabled={disabled || loading}
          className={`${getInputClassName(className, error, disabled)} ${resizeClass}`}
          {...inputProps}
        />
        {showCharCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
};