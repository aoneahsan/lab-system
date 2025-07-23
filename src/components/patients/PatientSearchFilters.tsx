import { useState } from 'react';
import type { PatientSearchFilters as Filters, PatientGender, PatientBloodGroup } from '@/types/patient.types';

interface PatientSearchFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  onSearch: () => void;
}

export const PatientSearchFilters = ({ onFiltersChange, onSearch }: PatientSearchFiltersProps) => {
  const [filters, setFilters] = useState<Filters>({});
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleFilterChange = (key: keyof Filters, value: string | number | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  const handleClearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };
  
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Search & Filters
        </h3>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {activeFilterCount} active
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, ID, phone, or email..."
            className="input pl-10"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          <svg
            className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {isExpanded ? 'Hide' : 'Show'} Advanced Filters
        </button>
        
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="label">Gender</label>
              <select
                className="input"
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value as PatientGender || undefined)}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            
            <div>
              <label className="label">Blood Group</label>
              <select
                className="input"
                value={filters.bloodGroup || ''}
                onChange={(e) => handleFilterChange('bloodGroup', e.target.value as PatientBloodGroup || undefined)}
              >
                <option value="">All</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="label">VIP Status</label>
              <select
                className="input"
                value={filters.isVip === undefined ? '' : filters.isVip.toString()}
                onChange={(e) => handleFilterChange('isVip', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">All</option>
                <option value="true">VIP Only</option>
                <option value="false">Non-VIP</option>
              </select>
            </div>
            
            <div>
              <label className="label">Age Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="input"
                  value={filters.ageMin || ''}
                  onChange={(e) => handleFilterChange('ageMin', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="input"
                  value={filters.ageMax || ''}
                  onChange={(e) => handleFilterChange('ageMax', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onSearch}
            className="btn btn-primary"
          >
            Search
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};