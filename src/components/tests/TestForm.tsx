import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLOINCSearch } from '@/hooks/useTests';
import type { TestDefinitionFormData, LOINCCode } from '@/types/test.types';

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
  const [loincSearchTerm, setLoincSearchTerm] = useState('');
  const [selectedLoinc, setSelectedLoinc] = useState<LOINCCode | null>(null);
  
  const { data: loincResults } = useLOINCSearch(loincSearchTerm);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    // watch,
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
    setValue('name', loinc.displayName);
    setLoincSearchTerm('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Code *
            </label>
            <input
              type="text"
              {...register('code', { required: 'Test code is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Test name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="chemistry">Chemistry</option>
              <option value="hematology">Hematology</option>
              <option value="microbiology">Microbiology</option>
              <option value="immunology">Immunology</option>
              <option value="pathology">Pathology</option>
              <option value="genetics">Genetics</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Test Options
        </h3>
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
              <p className="text-gray-500">Orders for this test require approval before processing</p>
            </div>
          </div>
        </div>
      </div>

      {/* LOINC Integration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          LOINC Integration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search LOINC Code
            </label>
            <input
              type="text"
              value={loincSearchTerm}
              onChange={(e) => setLoincSearchTerm(e.target.value)}
              placeholder="Search by code or name..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {loincResults && loincResults.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {loincResults.map((loinc) => (
                <button
                  key={loinc.code}
                  type="button"
                  onClick={() => handleLoincSelect(loinc)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{loinc.code}</div>
                  <div className="text-sm text-gray-600">{loinc.displayName}</div>
                </button>
              ))}
            </div>
          )}

          {selectedLoinc && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Selected LOINC:</span> {selectedLoinc.code} - {selectedLoinc.displayName}
              </p>
            </div>
          )}
        </div>
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
  );
};

export default TestForm;