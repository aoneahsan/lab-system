import React from 'react';
import { CalendarIcon, Paperclip } from 'lucide-react';

interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: any;
  helpText?: string;
  section?: string;
}

interface DynamicFieldRendererProps {
  fields: FieldDefinition[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
  sections?: boolean;
}

export default function DynamicFieldRenderer({
  fields,
  values,
  onChange,
  errors = {},
  readOnly = false,
  sections = true,
}: DynamicFieldRendererProps) {
  const fieldsBySection = sections
    ? fields.reduce((acc, field) => {
        const section = field.section || 'General';
        if (!acc[section]) acc[section] = [];
        acc[section].push(field);
        return acc;
      }, {} as Record<string, FieldDefinition[]>)
    : { '': fields };

  const renderField = (field: FieldDefinition) => {
    const value = values[field.name] ?? field.defaultValue ?? '';
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.id}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={readOnly}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${readOnly ? 'bg-gray-100' : ''}`}
            placeholder={field.label}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.valueAsNumber)}
            disabled={readOnly}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${readOnly ? 'bg-gray-100' : ''}`}
            placeholder={field.label}
          />
        );

      case 'date':
        return (
          <div className="relative">
            <input
              type="date"
              id={field.id}
              name={field.name}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={readOnly}
              className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              } ${readOnly ? 'bg-gray-100' : ''}`}
            />
            <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        );

      case 'select':
        return (
          <select
            id={field.id}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={readOnly}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${readOnly ? 'bg-gray-100' : ''}`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              name={field.name}
              checked={value || false}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={readOnly}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={readOnly}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${readOnly ? 'bg-gray-100' : ''}`}
            placeholder={field.label}
          />
        );

      case 'file':
        return (
          <div className="space-y-2">
            <label
              htmlFor={field.id}
              className={`flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Paperclip className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">
                {value ? 'File selected' : 'Choose file'}
              </span>
              <input
                type="file"
                id={field.id}
                name={field.name}
                onChange={(e) => onChange(field.name, e.target.files?.[0])}
                disabled={readOnly}
                className="hidden"
              />
            </label>
            {value && typeof value === 'string' && (
              <p className="text-sm text-gray-600">{value}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(fieldsBySection).map(([section, sectionFields]) => (
        <div key={section} className="space-y-4">
          {sections && section && (
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              {section}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionFields.map((field) => (
              <div
                key={field.id}
                className={field.type === 'textarea' ? 'md:col-span-2' : ''}
              >
                {field.type !== 'checkbox' && (
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderField(field)}
                {field.helpText && (
                  <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                )}
                {errors[field.name] && (
                  <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}