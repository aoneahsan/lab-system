import React from 'react';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';

export interface RadioOption {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}

interface RadioCardFieldProps extends BaseFormFieldProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
  cardSize?: 'sm' | 'md' | 'lg';
}

export const RadioCardField: React.FC<RadioCardFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  columns = 1,
  cardSize = 'md',
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
  const handleSelect = (optionId: string) => {
    if (disabled || loading) return;
    onChange(optionId);
  };

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns];

  const paddingClass = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[cardSize];

  const badgeColors = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
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
      <div className={`grid ${gridClass} gap-3`}>
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={disabled || loading}
              className={`
                relative group text-left rounded-lg border transition-all duration-200 ${paddingClass}
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-sm ring-2 ring-primary-500/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${disabled || loading
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-md'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                {/* Radio button */}
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 mt-0.5
                  ${isSelected 
                    ? 'border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}>
                  <div className={`
                    w-2.5 h-2.5 rounded-full m-auto mt-0.5 transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary-500' 
                      : 'bg-transparent'
                    }
                  `} />
                </div>

                {/* Icon (optional) */}
                {Icon && (
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200
                    ${isSelected 
                      ? 'bg-primary-100 dark:bg-primary-800/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                    }
                  `}>
                    <Icon className={`
                      h-4 w-4 transition-colors duration-200
                      ${isSelected 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`
                        text-sm font-medium transition-colors duration-200
                        ${isSelected 
                          ? 'text-primary-900 dark:text-primary-100' 
                          : 'text-gray-900 dark:text-white'
                        }
                      `}>
                        {option.title}
                      </h3>
                      <p className={`
                        mt-1 text-xs transition-colors duration-200
                        ${isSelected 
                          ? 'text-primary-700 dark:text-primary-300' 
                          : 'text-gray-500 dark:text-gray-400'
                        }
                      `}>
                        {option.description}
                      </p>
                    </div>

                    {/* Badge (optional) */}
                    {option.badge && (
                      <span className={`
                        ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${badgeColors[option.badgeColor || 'gray']}
                      `}>
                        {option.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </FormFieldWrapper>
  );
};