import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventory';
import { formatCurrency } from '../../utils/formatters';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: summary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => inventoryService.getStockSummary()
  });

  const { data: alerts } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => inventoryService.getStockAlerts({ acknowledged: false })
  });

  const { data: expiringItems } = useQuery({
    queryKey: ['expiring-items'],
    queryFn: () => inventoryService.getExpiryReport(30)
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryService.getInventoryItems({ lowStock: true, limit: 5 })
  });

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' || a.severity === 'high') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/inventory/orders')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ShoppingCartIcon className="h-4 w-4 mr-2" />
            Purchase Orders
          </button>
          <button
            onClick={() => navigate('/inventory/items/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Critical Alerts</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {criticalAlerts.slice(0, 3).map((alert) => (
                    <li key={alert.alertId}>{alert.message}</li>
                  ))}
                </ul>
                {criticalAlerts.length > 3 && (
                  <p className="mt-2">
                    <button
                      onClick={() => navigate('/inventory/alerts')}
                      className="font-medium underline"
                    >
                      View all {criticalAlerts.length} critical alerts
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary?.totalItems || 0}
              </p>
            </div>
            <CubeIcon className="h-12 w-12 text-blue-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Active inventory items</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.totalValue || 0)}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-green-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Inventory valuation</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {summary?.lowStockCount || 0}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Items below reorder point</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-semibold text-red-600">
                {summary?.expiringCount || 0}
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-red-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Within 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Low Stock Items</h2>
              <button
                onClick={() => navigate('/inventory/items?filter=lowStock')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            {lowStockItems?.items.length === 0 ? (
              <p className="text-sm text-gray-500">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems?.items.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-yellow-600">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {item.minStock} {item.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expiring Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Expiring Soon</h2>
              <button
                onClick={() => navigate('/inventory/expiry')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            {expiringItems?.length === 0 ? (
              <p className="text-sm text-gray-500">No items expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiringItems?.slice(0, 5).map((item) => {
                  const daysUntilExpiry = item.expiryDate 
                    ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  
                  return (
                    <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Lot: {item.lot || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">
                          {daysUntilExpiry} days
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary?.categoryBreakdown && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500 capitalize">{category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;