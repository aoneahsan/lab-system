import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { CreateCustomFieldData, CustomFieldType, CustomFieldOption, CustomFieldValidation } from '@/types/custom-field.types';

interface CustomFieldDefinitionFormProps {
  onSubmit: (data: CreateCustomFieldData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<CreateCustomFieldData>;
}

const fieldTypes: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
];

export const CustomFieldDefinitionForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
}: CustomFieldDefinitionFormProps) => {
  const [options, setOptions] = useState<CustomFieldOption[]>(
    initialData?.options || [{ label: '', value: '', isDefault: false }]
  );
  const [validations, setValidations] = useState<CustomFieldValidation[]>(
    initialData?.validations || []
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateCustomFieldData>({
    defaultValues: {
      module: 'patient',
      ...initialData,
    },
  });

  const fieldType = watch('type');
  const showOptions = ['select', 'multiselect', 'radio'].includes(fieldType);

  const addOption = () => {
    setOptions([...options, { label: '', value: '', isDefault: false }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof CustomFieldOption, value: string | boolean) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    
    // If setting default, unset others for single-select types
    if (field === 'isDefault' && value && ['select', 'radio'].includes(fieldType)) {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) opt.isDefault = false;
      });
    }
    
    setOptions(updatedOptions);
  };

  const onFormSubmit = (data: CreateCustomFieldData) => {
    // Generate field key from label if not provided
    if (!data.fieldKey) {
      data.fieldKey = data.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    }

    // Filter out empty options
    if (showOptions) {
      data.options = options.filter(opt => opt.label && opt.value);
    }

    // Add validations
    data.validations = validations;

    // Add required validation if needed
    if (data.isRequired && !validations.some(v => v.type === 'required')) {
      data.validations.push({
        type: 'required',
        message: `${data.label} is required`,
      });
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Module *</label>
          <select {...register('module', { required: 'Module is required' })} className="input" disabled={!!initialData}>
            <option value="patient">Patient</option>
            <option value="test">Test</option>
            <option value="sample">Sample</option>
            <option value="billing">Billing</option>
            <option value="inventory">Inventory</option>
          </select>
          {errors.module && <p className="text-sm text-danger-600 mt-1">{errors.module.message}</p>}
        </div>

        <div>
          <label className="label">Field Type *</label>
          <select {...register('type', { required: 'Field type is required' })} className="input">
            <option value="">Select Type</option>
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.type && <p className="text-sm text-danger-600 mt-1">{errors.type.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Field Label *</label>
          <input
            type="text"
            {...register('label', { required: 'Label is required' })}
            className="input"
            placeholder="e.g., SSN Number"
          />
          {errors.label && <p className="text-sm text-danger-600 mt-1">{errors.label.message}</p>}
        </div>

        <div>
          <label className="label">Field Key</label>
          <input
            type="text"
            {...register('fieldKey', {
              pattern: {
                value: /^[a-z0-9_]+$/,
                message: 'Only lowercase letters, numbers, and underscores allowed'
              }
            })}
            className="input"
            placeholder="e.g., ssn_number (auto-generated if empty)"
          />
          {errors.fieldKey && <p className="text-sm text-danger-600 mt-1">{errors.fieldKey.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Placeholder</label>
          <input
            type="text"
            {...register('placeholder')}
            className="input"
            placeholder="Placeholder text"
          />
        </div>

        <div>
          <label className="label">Section</label>
          <input
            type="text"
            {...register('section')}
            className="input"
            placeholder="e.g., Insurance Information"
          />
        </div>
      </div>

      <div>
        <label className="label">Helper Text</label>
        <textarea
          {...register('helperText')}
          className="input"
          rows={2}
          placeholder="Additional help text for the field"
        />
      </div>

      {showOptions && (
        <div>
          <label className="label">Options</label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 cursor-move"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  className="input flex-1"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  className="input flex-1"
                  placeholder="Value"
                />
                {['select', 'radio'].includes(fieldType) && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={option.isDefault}
                      onChange={(e) => updateOption(index, 'isDefault', e.target.checked)}
                      className="mr-2"
                    />
                    Default
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-danger-600 hover:text-danger-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="btn btn-secondary btn-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('isRequired')}
            className="mr-2"
          />
          Required Field
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('showInList')}
            className="mr-2"
          />
          Show in Lists
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('showInSearch')}
            className="mr-2"
          />
          Searchable
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('showInReports')}
            className="mr-2"
          />
          Include in Reports
        </label>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Field' : 'Create Field'}
        </button>
      </div>
    </form>
  );
};