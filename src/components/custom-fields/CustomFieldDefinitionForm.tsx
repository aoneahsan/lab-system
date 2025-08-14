import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { TextField, SelectField, LexicalEditorField, CheckboxField } from '@/components/form-fields';
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
  const [validations] = useState<CustomFieldValidation[]>(
    initialData?.validations || []
  );
  // TODO: Implement validation management UI
  // const [validations, setValidations] = useState<CustomFieldValidation[]>(
  //   initialData?.validations || []
  // );

  const {
    control,
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
        <Controller
          name="module"
          control={control}
          rules={{ required: 'Module is required' }}
          render={({ field }) => (
            <SelectField
              label="Module *"
              options={[
                { value: 'patient', label: 'Patient' },
                { value: 'test', label: 'Test' },
                { value: 'sample', label: 'Sample' },
                { value: 'billing', label: 'Billing' },
                { value: 'inventory', label: 'Inventory' }
              ]}
              disabled={!!initialData}
              error={errors.module?.message}
              {...field}
              onValueChange={field.onChange}
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          rules={{ required: 'Field type is required' }}
          render={({ field }) => (
            <SelectField
              label="Field Type *"
              placeholder="Select Type"
              options={fieldTypes}
              error={errors.type?.message}
              {...field}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="label"
          control={control}
          rules={{ required: 'Label is required' }}
          render={({ field }) => (
            <TextField
              label="Field Label *"
              placeholder="e.g., SSN Number"
              error={errors.label?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="fieldKey"
          control={control}
          rules={{
            pattern: {
              value: /^[a-z0-9_]+$/,
              message: 'Only lowercase letters, numbers, and underscores allowed'
            }
          }}
          render={({ field }) => (
            <TextField
              label="Field Key"
              placeholder="e.g., ssn_number (auto-generated if empty)"
              error={errors.fieldKey?.message}
              {...field}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="placeholder"
          control={control}
          render={({ field }) => (
            <TextField
              label="Placeholder"
              placeholder="Placeholder text"
              {...field}
            />
          )}
        />

        <Controller
          name="section"
          control={control}
          render={({ field }) => (
            <TextField
              label="Section"
              placeholder="e.g., Insurance Information"
              {...field}
            />
          )}
        />
      </div>

      <Controller
        name="helperText"
        control={control}
        render={({ field }) => (
          <LexicalEditorField
            label="Helper Text"
            placeholder="Additional help text for the field"
            {...field}
          />
        )}
      />

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
                <TextField
                  value={option.label}
                  onChange={(value) => updateOption(index, 'label', value)}
                  placeholder="Label"
                  className="flex-1"
                />
                <TextField
                  value={option.value}
                  onChange={(value) => updateOption(index, 'value', value)}
                  placeholder="Value"
                  className="flex-1"
                />
                {['select', 'radio'].includes(fieldType) && (
                  <CheckboxField
                    label="Default"
                    checked={option.isDefault}
                    onChange={(checked) => updateOption(index, 'isDefault', checked)}
                  />
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
        <Controller
          name="isRequired"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Required Field"
              {...field}
            />
          )}
        />
        <Controller
          name="showInList"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Show in Lists"
              {...field}
            />
          )}
        />
        <Controller
          name="showInSearch"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Searchable"
              {...field}
            />
          )}
        />
        <Controller
          name="showInReports"
          control={control}
          render={({ field }) => (
            <CheckboxField
              label="Include in Reports"
              {...field}
            />
          )}
        />
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