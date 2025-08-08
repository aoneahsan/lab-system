import { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { toast } from '@/stores/toast.store';

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

interface DynamicFieldBuilderProps {
  entityType: 'patient' | 'test' | 'sample' | 'result';
  onSave: (fields: FieldDefinition[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'textarea', label: 'Text Area', icon: '📄' },
  { value: 'file', label: 'File Upload', icon: '📎' },
];

export default function DynamicFieldBuilder({ entityType, onSave }: DynamicFieldBuilderProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [showFieldConfig, setShowFieldConfig] = useState<string | null>(null);

  const handleAddField = () => {
    const newField: FieldDefinition = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
    setShowFieldConfig(newField.id);
  };

  const handleUpdateField = (id: string, updates: Partial<FieldDefinition>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleSaveFields = () => {
    // Validate fields
    const invalidFields = fields.filter(f => !f.name || !f.label);
    if (invalidFields.length > 0) {
      toast.error('Invalid fields', 'All fields must have a name and label');
      return;
    }

    onSave(fields);
    toast.success('Fields saved', `Custom fields for ${entityType} have been saved`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Custom Fields for {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </h3>
          <p className="text-sm text-gray-600">
            Add custom fields to capture additional information
          </p>
        </div>
        <button
          onClick={handleAddField}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>

      {/* Fields List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No custom fields defined yet</p>
            <button
              onClick={handleAddField}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Add your first field
            </button>
          </div>
        ) : (
          fields.map((field) => (
            <div
              key={field.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                  
                  <div className="flex-1 space-y-3">
                    {showFieldConfig === field.id ? (
                      // Field Configuration Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Field Name (Internal)
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleUpdateField(field.id, { 
                                name: e.target.value.replace(/\s+/g, '_').toLowerCase() 
                              })}
                              placeholder="field_name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                              placeholder="Field Label"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Field Type
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => handleUpdateField(field.id, { 
                                type: e.target.value as FieldDefinition['type'] 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {FIELD_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => handleUpdateField(field.id, { 
                                  required: e.target.checked 
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Required</span>
                            </label>
                          </div>
                        </div>

                        {field.type === 'select' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Options (one per line)
                            </label>
                            <textarea
                              value={field.options?.join('\n') || ''}
                              onChange={(e) => handleUpdateField(field.id, { 
                                options: e.target.value.split('\n').filter(o => o.trim()) 
                              })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Help Text
                          </label>
                          <input
                            type="text"
                            value={field.helpText || ''}
                            onChange={(e) => handleUpdateField(field.id, { helpText: e.target.value })}
                            placeholder="Optional help text for users"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <button
                          onClick={() => setShowFieldConfig(null)}
                          className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          Done Configuring
                        </button>
                      </div>
                    ) : (
                      // Field Summary
                      <div
                        onClick={() => setShowFieldConfig(field.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {field.label || 'Untitled Field'}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-600">*Required</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Name: {field.name || 'undefined'}</span>
                          <span>Type: {field.type}</span>
                          {field.options && (
                            <span>{field.options.length} options</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setShowFieldConfig(
                      showFieldConfig === field.id ? null : field.id
                    )}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Button */}
      {fields.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveFields}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Custom Fields
          </button>
        </div>
      )}
    </div>
  );
}