import { Controller, useFormContext } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCustomFieldSections } from '@/hooks/useCustomFields';
import { TextField, EmailField, NumberField, LexicalEditorField, SelectField, CheckboxField, DateField } from '@/components/form-fields';
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
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <TextField
                {...formField}
                placeholder={field.placeholder}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <TextField
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={readOnly}
            error={error}
          />
        );

      case 'email':
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <EmailField
                {...formField}
                placeholder={field.placeholder}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <EmailField
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={readOnly}
            error={error}
          />
        );

      case 'phone':
      case 'url':
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <TextField
                {...formField}
                type={field.type === 'phone' ? 'tel' : field.type}
                placeholder={field.placeholder}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <TextField
            value={value}
            onChange={handleChange}
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            disabled={readOnly}
            error={error}
          />
        );

      case 'number':
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <NumberField
                {...formField}
                placeholder={field.placeholder}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <NumberField
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={readOnly}
            error={error}
          />
        );

      case 'textarea':
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <LexicalEditorField
                {...formField}
                placeholder={field.placeholder}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <LexicalEditorField
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={readOnly}
            error={error}
          />
        );

      case 'date':
      case 'datetime': {
        const dateValue = value instanceof Date ? value : value ? new Date(value) : null;
        
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <DateField
                {...formField}
                value={formField.value as Date}
                showTime={field.type === 'datetime'}
                placeholder={field.placeholder || 'Select date'}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <DateField
            value={dateValue}
            onChange={handleChange}
            showTime={field.type === 'datetime'}
            placeholder={field.placeholder || 'Select date'}
            disabled={readOnly}
            error={error}
          />
        );
      }

      case 'select':
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <SelectField
                {...formField}
                onValueChange={formField.onChange}
                placeholder={`Select ${field.label}`}
                options={field.options || []}
                disabled={readOnly}
                error={error}
              />
            )}
          />
        ) : (
          <SelectField
            value={value}
            onValueChange={handleChange}
            placeholder={`Select ${field.label}`}
            options={field.options || []}
            disabled={readOnly}
            error={error}
          />
        );

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value : [];
        
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <CheckboxField
                key={option.value}
                label={option.label}
                checked={selectedValues.includes(option.value)}
                onChange={(checked) => {
                  const newValues = checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((v) => v !== option.value);
                  handleChange(newValues);
                }}
                disabled={readOnly}
              />
            ))}
          </div>
        );
      }

      case 'checkbox':
        return hasFormContext ? (
          <Controller
            name={fieldKey}
            control={formContext.control}
            render={({ field: formField }) => (
              <CheckboxField
                {...formField}
                label={field.placeholder || 'Yes'}
                disabled={readOnly}
              />
            )}
          />
        ) : (
          <CheckboxField
            checked={!!value}
            onChange={handleChange}
            label={field.placeholder || 'Yes'}
            disabled={readOnly}
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <CheckboxField
                key={option.value}
                label={option.label}
                checked={value === option.value}
                onChange={(checked) => checked && handleChange(option.value)}
                disabled={readOnly}
                type="radio"
                name={fieldKey}
              />
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