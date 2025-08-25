import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  register?: UseFormRegisterReturn;
  error?: any;
  disabled?: boolean;
  helpText?: string;
  className?: string;
  containerClassName?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  name,
  checked = false,
  onChange,
  register,
  error,
  disabled = false,
  helpText,
  className = '',
  containerClassName = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  const inputProps = register || {
    name,
    onChange: handleChange,
    checked,
  };

  return (
    <div className={`checkbox-field ${containerClassName}`}>
      <label className="flex items-start cursor-pointer">
        <input
          id={name}
          type="checkbox"
          disabled={disabled}
          className={`
            mt-1 h-4 w-4 
            text-primary-600 
            border-gray-300 dark:border-gray-600 
            rounded 
            focus:ring-primary-500 
            disabled:opacity-50 
            disabled:cursor-not-allowed
            ${error ? 'border-red-300 dark:border-red-600' : ''}
            ${className}
          `}
          {...inputProps}
        />
        <div className="ml-2">
          <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${disabled ? 'opacity-50' : ''}`}>
            {label}
          </span>
          {helpText && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>
          )}
        </div>
      </label>
      {error && (
        <p className="mt-1 ml-6 text-sm text-red-600 dark:text-red-400">
          {typeof error === 'string' ? error : error.message}
        </p>
      )}
    </div>
  );
};

interface SwitchFieldProps {
  label: string;
  name: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  register?: UseFormRegisterReturn;
  error?: any;
  disabled?: boolean;
  helpText?: string;
  labelPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  containerClassName?: string;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  name,
  checked = false,
  onChange,
  register,
  error,
  disabled = false,
  helpText,
  labelPosition = 'right',
  size = 'md',
  className = '',
  containerClassName = '',
}) => {
  const [isChecked, setIsChecked] = React.useState(checked);

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleClick = () => {
    if (!disabled) {
      const newValue = !isChecked;
      setIsChecked(newValue);
      onChange?.(newValue);
    }
  };

  const sizeClasses = {
    sm: {
      switch: 'w-8 h-4',
      dot: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'w-11 h-6',
      dot: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'w-14 h-7',
      dot: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  }[size];

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative inline-flex shrink-0
        ${sizeClasses.switch}
        border-2 border-transparent 
        rounded-full 
        cursor-pointer 
        transition-colors 
        ease-in-out 
        duration-200 
        focus:outline-none 
        focus:ring-2 
        focus:ring-offset-2 
        focus:ring-primary-500
        ${isChecked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${error ? 'ring-2 ring-red-500' : ''}
        ${className}
      `}
    >
      <span
        className={`
          ${sizeClasses.dot}
          pointer-events-none 
          inline-block 
          rounded-full 
          bg-white 
          shadow 
          transform 
          ring-0 
          transition 
          ease-in-out 
          duration-200
          ${isChecked ? sizeClasses.translate : 'translate-x-0'}
        `}
      />
    </button>
  );

  React.useEffect(() => {
    if (register) {
      register.onChange({ target: { name, value: isChecked } } as any);
    }
  }, [isChecked, name, register]);

  return (
    <div className={`switch-field ${containerClassName}`}>
      <div className="flex items-center">
        {labelPosition === 'left' && (
          <label htmlFor={name} className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        {switchElement}
        
        {labelPosition === 'right' && (
          <label htmlFor={name} className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
      </div>
      
      {helpText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {typeof error === 'string' ? error : error.message}
        </p>
      )}
    </div>
  );
};