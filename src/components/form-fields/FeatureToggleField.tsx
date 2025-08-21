import React from 'react';
import { Check } from 'lucide-react';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';

export interface FeatureOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
  comingSoon?: boolean;
}

interface FeatureToggleFieldProps extends BaseFormFieldProps {
  options: FeatureOption[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: 1 | 2 | 3;
}

export const FeatureToggleField: React.FC<FeatureToggleFieldProps> = ({
  label,
  name,
  options,
  value = [],
  onChange,
  columns = 2,
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
  const handleToggle = (featureId: string) => {
    if (disabled || loading) return;
    
    const newValue = value.includes(featureId)
      ? value.filter(id => id !== featureId)
      : [...value, featureId];
    
    onChange(newValue);
  };

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns];

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
      <div className={`grid ${gridClass} gap-4`}>
        {options.map((feature) => {
          const Icon = feature.icon;
          const isSelected = value.includes(feature.id);
          const isDisabled = disabled || loading || feature.comingSoon;

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => !feature.comingSoon && handleToggle(feature.id)}
              disabled={isDisabled}
              className={`
                relative group text-left rounded-lg border-2 p-4 transition-all duration-200
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isDisabled 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-md'
                }
                ${feature.comingSoon 
                  ? 'cursor-not-allowed opacity-50' 
                  : ''
                }
              `}
            >
              {/* Selection indicator */}
              <div className={`
                absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all duration-200
                ${isSelected 
                  ? 'bg-primary-500 border-primary-500' 
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                }
              `}>
                {isSelected && (
                  <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
                )}
              </div>

              {/* Recommended badge */}
              {feature.recommended && !feature.comingSoon && (
                <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Recommended
                </span>
              )}

              {/* Coming soon badge */}
              {feature.comingSoon && (
                <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Coming Soon
                </span>
              )}

              {/* Content */}
              <div className={`${feature.recommended || feature.comingSoon ? 'mt-6' : ''}`}>
                <div className="flex items-start space-x-3">
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200
                    ${isSelected 
                      ? 'bg-primary-100 dark:bg-primary-800/30' 
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }
                  `}>
                    <Icon className={`
                      h-5 w-5 transition-colors duration-200
                      ${isSelected 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`
                      text-sm font-medium transition-colors duration-200
                      ${isSelected 
                        ? 'text-primary-900 dark:text-primary-100' 
                        : 'text-gray-900 dark:text-white'
                      }
                    `}>
                      {feature.title}
                    </h3>
                    <p className={`
                      mt-1 text-xs transition-colors duration-200
                      ${isSelected 
                        ? 'text-primary-700 dark:text-primary-300' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {feature.description}
                    </p>
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