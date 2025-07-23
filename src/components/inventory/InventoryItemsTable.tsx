/**
 * Inventory Items Table Component
 * Displays inventory items in a sortable table with actions
 */

import React, { useState } from 'react';
import { InventoryItem } from '@/types/inventory.types';
import { Package, AlertTriangle, Edit, Archive, TrendingUp } from 'lucide-react';

interface InventoryItemsTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onViewDetails: (item: InventoryItem) => void;
  onRecordTransaction: (item: InventoryItem) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'category' | 'currentStock' | 'reorderPoint';
type SortDirection = 'asc' | 'desc';

export const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({
  items,
  onEdit,
  onViewDetails,
  onRecordTransaction,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) {
      return { label: 'Out of Stock', color: 'red' };
    } else if (item.currentStock <= item.minimumStock) {
      return { label: 'Critical', color: 'red' };
    } else if (item.currentStock <= item.reorderPoint) {
      return { label: 'Low', color: 'yellow' };
    } else if (item.maximumStock && item.currentStock >= item.maximumStock) {
      return { label: 'Overstock', color: 'orange' };
    }
    return { label: 'Normal', color: 'green' };
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No inventory items found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Item Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {sortField === 'category' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('currentStock')}
              >
                <div className="flex items-center">
                  Current Stock
                  {sortField === 'currentStock' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item) => {
              const status = getStockStatus(item);
              const stockValue = (item.unitCost || 0) * item.currentStock;
              
              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewDetails(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {item.catalogNumber && (
                        <p className="text-xs text-gray-500">Cat# {item.catalogNumber}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {item.currentStock} {item.unit}
                      </span>
                      {item.currentStock <= item.reorderPoint && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.minimumStock} | Reorder: {item.reorderPoint}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${status.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${status.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                      `}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(stockValue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRecordTransaction(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Record transaction"
                      >
                        <TrendingUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit item"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {!item.isActive && (
                        <Archive className="w-5 h-5 text-gray-400" title="Inactive" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};