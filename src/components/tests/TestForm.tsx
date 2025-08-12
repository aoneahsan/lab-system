import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search } from 'lucide-react';
import LOINCBrowser from './LOINCBrowser';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import type { TestDefinitionFormData, LOINCCode } from '@/types/test.types';
import { TextField, SelectField, NumberField, TextareaField, CheckboxField } from '@/components/form-fields';

interface TestFormProps {
  initialData?: Partial<TestDefinitionFormData>;
  onSubmit: (data: TestDefinitionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TestForm: React.FC<TestFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [showLOINCBrowser, setShowLOINCBrowser] = useState(false);
  const [selectedLoinc, setSelectedLoinc] = useState<LOINCCode | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestDefinitionFormData>({
    defaultValues: initialData || {
      name: '',
      code: '',
      category: 'chemistry',
      specimen: {
        type: 'blood',
        volumeUnit: 'ml',
      },
      turnaroundTime: {
        routine: 24,
      },
      resultType: 'numeric',
      isActive: true,
      isOrderable: true,
      requiresApproval: false,
      decimalPlaces: 2,
    },
  });

  // const resultType = watch('resultType');

  const handleLoincSelect = (loinc: LOINCCode) => {
    setSelectedLoinc(loinc);
    setValue('loincCode', loinc.code);
    if (!initialData?.name) {
      setValue('name', loinc.displayName);
    }
    setShowLOINCBrowser(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Test Code"
              name="code"
              register={register('code', { required: 'Test code is required' })}
              error={errors.code}
              required
            />

            <TextField
              label="Test Name"
              name="name"
              register={register('name', { required: 'Test name is required' })}
              error={errors.name}
              required
            />

            <SelectField
              label="Category"
              name="category"
              value={watch('category')}
              onChange={(value) => setValue('category', value || 'chemistry')}
              options={[
                { value: 'chemistry', label: 'Chemistry' },
                { value: 'hematology', label: 'Hematology' },
                { value: 'microbiology', label: 'Microbiology' },
                { value: 'immunology', label: 'Immunology' },
                { value: 'pathology', label: 'Pathology' },
                { value: 'genetics', label: 'Genetics' },
                { value: 'other', label: 'Other' },
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                {...register('department')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Test Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Options</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Active</label>
                <p className="text-gray-500">Test is available for ordering</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('isOrderable')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Orderable</label>
                <p className="text-gray-500">Test can be ordered by providers</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('requiresApproval')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Requires Approval</label>
                <p className="text-gray-500">
                  Orders for this test require approval before processing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LOINC Integration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">LOINC Integration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LOINC Code</label>
              <button
                type="button"
                onClick={() => setShowLOINCBrowser(true)}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  {selectedLoinc ? (
                    <span>
                      <span className="font-mono">{selectedLoinc.code}</span> -{' '}
                      {selectedLoinc.displayName}
                    </span>
                  ) : (
                    <span className="text-gray-500">Browse LOINC codes...</span>
                  )}
                </span>
              </button>
            </div>

            {selectedLoinc && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Selected LOINC Code</h4>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="inline text-gray-600">Code:</dt>
                    <dd className="inline ml-2 font-mono">{selectedLoinc.code}</dd>
                  </div>
                  <div>
                    <dt className="inline text-gray-600">Name:</dt>
                    <dd className="inline ml-2">{selectedLoinc.displayName}</dd>
                  </div>
                  {selectedLoinc.class && (
                    <div>
                      <dt className="inline text-gray-600">Class:</dt>
                      <dd className="inline ml-2">{selectedLoinc.class}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Custom Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
          <CustomFieldsManager
            module="test"
            errors={(errors.customFields as any) || {}}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Test'}
          </button>
        </div>
      </form>

      {/* LOINC Browser Modal */}
      {showLOINCBrowser && (
        <LOINCBrowser
          onSelect={handleLoincSelect}
          onClose={() => setShowLOINCBrowser(false)}
          selectedCode={selectedLoinc?.code}
        />
      )}
    </>
  );
};

export default TestForm;
