import { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useCustomFieldsByModule, useCreateCustomField, useUpdateCustomField, useDeleteCustomField } from '@/hooks/useCustomFields';
import { CustomFieldDefinitionForm } from '@/components/custom-fields/CustomFieldDefinitionForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { CustomFieldDefinition, CreateCustomFieldData, UpdateCustomFieldData } from '@/types/custom-field.types';

const modules = [
  { value: 'patient', label: 'Patients' },
  { value: 'test', label: 'Tests' },
  { value: 'sample', label: 'Samples' },
  { value: 'billing', label: 'Billing' },
  { value: 'inventory', label: 'Inventory' },
];

const CustomFieldsPage = () => {
  const [selectedModule, setSelectedModule] = useState<CustomFieldDefinition['module']>('patient');
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);

  const { data: customFields = [], isLoading } = useCustomFieldsByModule(selectedModule, false);
  const createMutation = useCreateCustomField();
  const updateMutation = useUpdateCustomField();
  const deleteMutation = useDeleteCustomField();

  const handleCreate = async (data: CreateCustomFieldData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: UpdateCustomFieldData) => {
    if (!editingField) return;
    await updateMutation.mutateAsync({
      fieldId: editingField.id,
      data,
    });
    setEditingField(null);
    setShowForm(false);
  };

  const handleDelete = async (field: CustomFieldDefinition) => {
    if (!confirm(`Are you sure you want to delete the field "${field.label}"? This action cannot be undone.`)) {
      return;
    }
    await deleteMutation.mutateAsync(field.id);
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingField(null);
  };

  const activeFields = customFields.filter(f => f.isActive);
  const inactiveFields = customFields.filter(f => !f.isActive);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Fields</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Define custom fields to capture additional information for different modules
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Field
          </button>
        </div>
      </div>

      {/* Module Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Module
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value as CustomFieldDefinition['module'])}
          className="input"
        >
          {modules.map((module) => (
            <option key={module.value} value={module.value}>
              {module.label}
            </option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </h2>
            </div>
            <div className="p-6">
              <CustomFieldDefinitionForm
                onSubmit={editingField ? handleUpdate : handleCreate}
                onCancel={handleFormCancel}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                initialData={editingField || { module: selectedModule }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Fields List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Fields */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Active Fields ({activeFields.length})
            </h2>
            {activeFields.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No active custom fields for {modules.find(m => m.value === selectedModule)?.label || selectedModule}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeFields.map((field) => (
                  <CustomFieldCard
                    key={field.id}
                    field={field}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Inactive Fields */}
          {inactiveFields.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Inactive Fields ({inactiveFields.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {inactiveFields.map((field) => (
                  <CustomFieldCard
                    key={field.id}
                    field={field}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CustomFieldCardProps {
  field: CustomFieldDefinition;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (field: CustomFieldDefinition) => void;
}

const CustomFieldCard = ({ field, onEdit, onDelete }: CustomFieldCardProps) => {
  const typeLabels: Record<string, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    datetime: 'Date & Time',
    select: 'Dropdown',
    multiselect: 'Multi-Select',
    checkbox: 'Checkbox',
    radio: 'Radio',
    textarea: 'Text Area',
    email: 'Email',
    phone: 'Phone',
    url: 'URL',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 text-gray-400 cursor-move">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{field.label}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">({field.fieldKey})</span>
              {field.isRequired && (
                <span className="text-xs text-red-600 dark:text-red-400">*Required</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Type: {typeLabels[field.type] || field.type}</span>
              {field.section && <span>Section: {field.section}</span>}
              <div className="flex items-center gap-2">
                {field.showInList && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    List
                  </span>
                )}
                {field.showInSearch && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Search
                  </span>
                )}
                {field.showInReports && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Reports
                  </span>
                )}
              </div>
            </div>
            {field.helperText && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{field.helperText}</p>
            )}
            {field.options && field.options.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Options:</p>
                <div className="flex flex-wrap gap-1">
                  {field.options.map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {option.label}
                      {option.isDefault && ' (default)'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(field)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit field"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(field)}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete field"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFieldsPage;