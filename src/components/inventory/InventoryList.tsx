import { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import { useUrlFilters } from '@/hooks/useUrlState';
import type { InventoryItem } from '@/types/inventory.types';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function InventoryList() {
  const [filters, setFilters] = useUrlFilters({
    searchTerm: null as string | null,
    category: null as string | null,
    status: null as string | null
  });
  const { items, loading, fetchInventoryItems } = useInventoryStore();

  useEffect(() => {
    fetchInventoryItems({ 
      category: filters.category || undefined, 
      status: filters.status || undefined 
    });
  }, [filters.category, filters.status, fetchInventoryItems]);

  const filteredItems = items.filter(
    (item) =>
      !filters.searchTerm ||
      item.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (item.catalogNumber && item.catalogNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()))
  );

  const getLowStockItems = () => {
    return items.filter((item) => item.currentStock <= item.reorderPoint);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) {
      return { color: 'text-red-600 bg-red-100', text: 'Out of Stock' };
    } else if (item.currentStock <= item.minimumStock) {
      return { color: 'text-red-600 bg-red-100', text: 'Critical' };
    } else if (item.currentStock <= item.reorderPoint) {
      return { color: 'text-yellow-600 bg-yellow-100', text: 'Low Stock' };
    } else {
      return { color: 'text-green-600 bg-green-100', text: 'In Stock' };
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Low Stock Alert */}
      {getLowStockItems().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">Low Stock Alert</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {getLowStockItems().length} items need reordering
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or catalog number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input"
          >
            <option value="all">All Categories</option>
            <option value="reagent">Reagents</option>
            <option value="consumable">Consumables</option>
            <option value="equipment">Equipment</option>
            <option value="chemical">Chemicals</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
            <option value="backordered">Backordered</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catalog Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.manufacturer}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.catalogNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Reorder: {item.reorderPoint} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
                      >
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                      <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
