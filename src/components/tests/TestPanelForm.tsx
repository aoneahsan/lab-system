import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Search } from 'lucide-react';
import { useTests } from '@/hooks/useTests';
import type { TestDefinition } from '@/types/test.types';

interface TestPanelFormData {
  name: string;
  code: string;
  category: string;
  description?: string;
  testIds: string[];
  isActive: boolean;
}

interface TestPanelFormProps {
  initialData?: Partial<TestPanelFormData>;
  onSubmit: (data: TestPanelFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TestPanelForm: React.FC<TestPanelFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTests, setSelectedTests] = useState<TestDefinition[]>([]);

  const { data: allTests = [] } = useTests({ isActive: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestPanelFormData>({
    defaultValues: initialData || {
      name: '',
      code: '',
      category: 'chemistry',
      isActive: true,
      testIds: [],
    },
  });

  const testIds = watch('testIds');

  // Initialize selected tests on edit
  useEffect(() => {
    if (initialData?.testIds && allTests.length > 0) {
      const tests = initialData.testIds
        .map((id) => allTests.find((t) => t.id === id))
        .filter((t): t is TestDefinition => t !== undefined);
      setSelectedTests(tests);
    }
  }, [initialData?.testIds, allTests]);

  const filteredTests = allTests.filter(
    (test) =>
      !testIds.includes(test.id) &&
      (test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTest = (test: TestDefinition) => {
    setSelectedTests([...selectedTests, test]);
    setValue('testIds', [...testIds, test.id]);
    setSearchTerm('');
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
    setValue(
      'testIds',
      testIds.filter((id) => id !== testId)
    );
  };

  const calculateTotalCost = () => {
    return selectedTests.reduce((sum, test) => sum + (test.cost || 0), 0);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Panel Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Panel Code *</label>
            <input
              type="text"
              {...register('code', { required: 'Panel code is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Panel Name *</label>
            <input
              type="text"
              {...register('name', { required: 'Panel name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
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
              <option value="wellness">Wellness</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Test Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tests in Panel</h3>

        {/* Search for tests */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests to add..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {searchTerm && filteredTests.length > 0 && (
            <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
              {filteredTests.slice(0, 10).map((test) => (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => handleAddTest(test)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">
                      Code: {test.code} | Category: {test.category}
                    </div>
                  </div>
                  <Plus className="h-5 w-5 text-blue-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected tests */}
        <div className="space-y-2">
          {selectedTests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No tests added yet. Search and add tests to this panel.
            </p>
          ) : (
            <>
              {selectedTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">
                      Code: {test.code} | {test.specimen.type} | ${test.cost || 0}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTest(test.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total Cost:</span>
                  <span>${calculateTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </>
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
          disabled={isLoading || selectedTests.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Panel'}
        </button>
      </div>
    </form>
  );
};

export default TestPanelForm;
