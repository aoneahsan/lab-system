import { Controller, useFormContext } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCustomFieldSections } from '@/hooks/useCustomFields';
import type { CustomFieldDefinition, CustomFieldSection } from '@/types/custom-field.types';
import { Loader2 } from 'lucide-react';

interface CustomFieldsManagerProps {
  module: CustomFieldDefinition['module'];
  values?: Record<string, any>;
  errors?: Record<string, string>;
  onChange?: (fieldKey: string, value: any) => void;
  readOnly?: boolean;
  showSections?: boolean;
}

export const CustomFieldsManager = ({
  module,
  values = {},
  errors = {},
  onChange,
  readOnly = false,
  showSections = true,
}: CustomFieldsManagerProps) => {
  const { data: sections, isLoading } = useCustomFieldSections(module);
  const formContext = useFormContext();
  const hasFormContext = !!formContext;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return null;
  }

  const renderField = (field: CustomFieldDefinition) => {
    const fieldKey = `customFields.${field.fieldKey}`;
    const value = values[field.fieldKey] ?? field.defaultValue ?? '';
    const error = errors[field.fieldKey];

    const handleChange = (newValue: any) => {
      if (onChange) {
        onChange(field.fieldKey, newValue);
      }
    };

    const commonProps = {
      disabled: readOnly,
      className: `input ${error ? 'border-danger-500' : ''}`,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return hasFormContext ? (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            {...formContext.register(fieldKey)}
            {...commonProps}
            placeholder={field.placeholder}
          />
        ) : (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            {...commonProps}
            placeholder={field.placeholder}
          />
        );

      case 'number':
        return hasFormContext ? (
          <input
            type="number"
            {...formContext.register(fieldKey, { valueAsNumber: true })}
            {...commonProps}
            placeholder={field.placeholder}
          />
        ) : (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.valueAsNumber || 0)}
            {...commonProps}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return hasFormContext ? (
          <textarea
            {...formContext.register(fieldKey)}
            {...commonProps}
            rows={3}
            placeholder={field.placeholder}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            {...commonProps}
            rows={3}
            placeholder={field.placeholder}
          />
        );

      case 'date':
      case 'datetime': {
        const dateValue = value instanceof Date ? value : value ? new Date(value) : null;
        
        if (hasFormContext) {
          return (
            <Controller
              name={fieldKey}
              control={formContext.control}
              render={({ field: formField }) => (
                <DatePicker
                  selected={formField.value as Date}
                  onChange={(date: Date | null) => formField.onChange(date)}
                  dateFormat={field.type === 'datetime' ? 'MM/dd/yyyy h:mm aa' : 'MM/dd/yyyy'}
                  showTimeSelect={field.type === 'datetime'}
                  disabled={readOnly}
                  placeholderText={field.placeholder || 'Select date'}
                  className={commonProps.className}
                />
              )}
            />
          );
        }
        
        return (
          <DatePicker
            selected={dateValue}
            onChange={(date: Date | null) => handleChange(date)}
            dateFormat={field.type === 'datetime' ? 'MM/dd/yyyy h:mm aa' : 'MM/dd/yyyy'}
            showTimeSelect={field.type === 'datetime'}
            disabled={readOnly}
            placeholderText={field.placeholder || 'Select date'}
            className={commonProps.className}
          />
        );
      }

      case 'select':
        return hasFormContext ? (
          <select {...formContext.register(fieldKey)} {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            {...commonProps}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value : [];
        
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value);
                    handleChange(newValues);
                  }}
                  disabled={readOnly}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'checkbox':
        return hasFormContext ? (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...formContext.register(fieldKey)}
              disabled={readOnly}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.placeholder || 'Yes'}
            </span>
          </label>
        ) : (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={readOnly}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.placeholder || 'Yes'}
            </span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={fieldKey}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={readOnly}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section: CustomFieldSection) => {
    if (section.fields.length === 0) return null;

    return (
      <div key={section.name} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {section.label}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.fieldKey} className="label">
                {field.label} {field.isRequired && '*'}
              </label>
              {renderField(field)}
              {field.helperText && (
                <p className="text-sm text-gray-500 mt-1">{field.helperText}</p>
              )}
              {errors[field.fieldKey] && (
                <p className="text-sm text-danger-600 mt-1">{errors[field.fieldKey]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (showSections) {
    return (
      <div className="space-y-6">
        {sections.map((section) => renderSection(section))}
      </div>
    );
  }

  // Render all fields without sections
  const allFields = sections.flatMap((section) => section.fields);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allFields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.fieldKey} className="label">
            {field.label} {field.isRequired && '*'}
          </label>
          {renderField(field)}
          {field.helperText && (
            <p className="text-sm text-gray-500 mt-1">{field.helperText}</p>
          )}
          {errors[field.fieldKey] && (
            <p className="text-sm text-danger-600 mt-1">{errors[field.fieldKey]}</p>
          )}
        </div>
      ))}
    </div>
  );
};