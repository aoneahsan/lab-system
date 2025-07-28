/**
 * Inventory Management Page
 * Main page for managing laboratory inventory
 */

import { useState } from 'react';
import { Plus, Download, Upload, AlertCircle } from 'lucide-react';
import { InventoryItemsTable } from '@/components/inventory/InventoryItemsTable';
import { InventoryItemForm } from '@/components/inventory/InventoryItemForm';
import { StockTransactionForm } from '@/components/inventory/StockTransactionForm';
import { InventoryAlerts } from '@/components/inventory/InventoryAlerts';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useRecordTransaction,
  useInventoryAlerts,
  useAcknowledgeAlert,
  useInventoryValue,
  useReorderItems,
  useExpiringItems,
} from '@/hooks/useInventory';
import type {
  InventoryItem,
  InventoryCategory,
  InventoryItemFormData,
  StockTransactionFormData,
} from '@/types/inventory.types';

export default function InventoryPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [transactionItem, setTransactionItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);

  // Queries
  const { data: itemsData, isLoading: itemsLoading } = useInventoryItems({
    category: selectedCategory || undefined,
    isActive: true,
    search: searchTerm,
  });
  const { data: alerts, isLoading: alertsLoading } = useInventoryAlerts();
  const { data: inventoryValue } = useInventoryValue();
  const { data: reorderItems } = useReorderItems();
  const { data: expiringItems } = useExpiringItems(30);

  // Mutations
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem(editingItem?.id || '');
  const recordTransaction = useRecordTransaction();
  const acknowledgeAlert = useAcknowledgeAlert();

  // Calculate stats
  const stats = {
    totalItems: itemsData?.items.length || 0,
    totalValue: inventoryValue?.totalValue || 0,
    lowStockItems: reorderItems?.length || 0,
    expiringItems: expiringItems?.length || 0,
    outOfStockItems: itemsData?.items.filter((item) => item.currentStock === 0).length || 0,
    activeAlerts: alerts?.length || 0,
    categoryBreakdown: inventoryValue?.categoryBreakdown,
  };

  const handleCreateItem = async (data: InventoryItemFormData) => {
    await createItem.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdateItem = async (data: Partial<InventoryItemFormData>) => {
    if (editingItem) {
      await updateItem.mutateAsync(data);
      setEditingItem(null);
      setShowForm(false);
    }
  };

  const handleRecordTransaction = async (data: StockTransactionFormData) => {
    await recordTransaction.mutateAsync(data);
    setTransactionItem(null);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export inventory data');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import inventory data');
  };

  const categories: InventoryCategory[] = [
    'reagent',
    'control',
    'calibrator',
    'consumable',
    'equipment',
    'ppe',
    'office_supply',
    'maintenance',
    'other',
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage laboratory supplies, reagents, and equipment
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {alerts && alerts.length > 0 && (
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative px-4 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{alerts.length} Alerts</span>
                </div>
              </button>
            )}
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export data"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleImport}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Import data"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Statistics */}
          <InventoryStats stats={stats} isLoading={itemsLoading} />

          {/* Alerts */}
          {showAlerts && alerts && alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
              <InventoryAlerts
                alerts={alerts}
                onAcknowledge={(alertId, actionTaken) => {
                  acknowledgeAlert.mutate({ alertId, actionTaken });
                }}
                isLoading={alertsLoading}
              />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as InventoryCategory | '')}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table */}
          <InventoryItemsTable
            items={itemsData?.items || []}
            onEdit={(item) => {
              setEditingItem(item);
              setShowForm(true);
            }}
            onViewDetails={(item) => {
              // TODO: Navigate to item detail page
              console.log('View details for:', item);
            }}
            onRecordTransaction={(item) => {
              setTransactionItem(item);
            }}
            isLoading={itemsLoading}
          />
        </div>
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <InventoryItemForm
                initialData={editingItem || undefined}
                onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                isLoading={createItem.isPending || updateItem.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {transactionItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Record Stock Transaction</h2>
              <StockTransactionForm
                item={transactionItem}
                onSubmit={handleRecordTransaction}
                onCancel={() => setTransactionItem(null)}
                isLoading={recordTransaction.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
