import React from 'react';
import type { TestFilter } from '@/types/test.types';

interface TestSearchFiltersProps {
  filters: TestFilter;
  onFiltersChange: (filters: TestFilter) => void;
}

const TestSearchFilters: React.FC<TestSearchFiltersProps> = ({ filters, onFiltersChange }) => {
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'genetics', label: 'Genetics' },
    { value: 'other', label: 'Other' },
  ];

  const specimenTypes = [
    { value: '', label: 'All Specimens' },
    { value: 'blood', label: 'Blood' },
    { value: 'urine', label: 'Urine' },
    { value: 'stool', label: 'Stool' },
    { value: 'sputum', label: 'Sputum' },
    { value: 'csf', label: 'CSF' },
    { value: 'tissue', label: 'Tissue' },
    { value: 'swab', label: 'Swab' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (key: keyof TestFilter, value: string | boolean | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      category: '',
      department: '',
      isActive: undefined,
      specimenType: '',
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            placeholder="Search by name or code..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specimen Type</label>
          <select
            value={filters.specimenType || ''}
            onChange={(e) => handleChange('specimenType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {specimenTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) =>
              handleChange(
                'isActive',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <input
          type="text"
          value={filters.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
          placeholder="Filter by department..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default TestSearchFilters;
