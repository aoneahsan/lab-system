import React from 'react';
import { Search, Filter } from 'lucide-react';

interface InventoryFilters {
  search: string;
  category: string;
  status: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  location: string;
}

interface InventorySearchFiltersProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
}

export const InventorySearchFilters: React.FC<InventorySearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="reagents">Reagents</option>
            <option value="consumables">Consumables</option>
            <option value="equipment">Equipment</option>
            <option value="calibrators">Calibrators</option>
            <option value="controls">Controls</option>
            <option value="supplies">Supplies</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <input
            type="text"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Active filters display */}
      {(filters.search || filters.category || filters.status !== 'all' || filters.location) && (
        <div className="mt-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              Search: {filters.search}
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              Category: {filters.category}
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              Status: {filters.status}
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              Location: {filters.location}
            </span>
          )}
          <button
            onClick={() => onFiltersChange({ search: '', category: '', status: 'all', location: '' })}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};