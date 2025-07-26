import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface ReportFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleDateChange = (field: string, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleFilterChange = (field: string, value: any) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <FunnelIcon className="h-5 w-5 mr-2" />
        Report Filters
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="form-input rounded-md border-gray-300"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="form-input rounded-md border-gray-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            value={filters.department || ''}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="mt-1 block w-full form-select rounded-md border-gray-300"
          >
            <option value="">All Departments</option>
            <option value="hematology">Hematology</option>
            <option value="chemistry">Chemistry</option>
            <option value="microbiology">Microbiology</option>
            <option value="immunology">Immunology</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="mt-1 block w-full form-select rounded-md border-gray-300"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Provider</label>
          <input
            type="text"
            value={filters.provider || ''}
            onChange={(e) => handleFilterChange('provider', e.target.value)}
            placeholder="Search by provider name"
            className="mt-1 block w-full form-input rounded-md border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Patient ID</label>
          <input
            type="text"
            value={filters.patientId || ''}
            onChange={(e) => handleFilterChange('patientId', e.target.value)}
            placeholder="Enter patient ID"
            className="mt-1 block w-full form-input rounded-md border-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;