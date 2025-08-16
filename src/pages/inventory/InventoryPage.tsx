import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Upload, Package, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import { useTenantStore } from '@/stores/tenant.store';
import { ImportExportDialog } from '@/components/data-management/ImportExportDialog';
import { InventoryImport } from '@/components/data-management/InventoryImport';
import { InventoryExport } from '@/components/data-management/InventoryExport';
import { ExportFormatter } from '@/utils/import-export/export-formatter';
import { ExcelParser } from '@/utils/import-export/excel-parser';
import { InventoryListTable } from '@/components/inventory/InventoryListTable';
import { InventorySearchFilters } from '@/components/inventory/InventorySearchFilters';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import { modalService } from '@/services/modalService';
import type { InventoryItem } from '@/types';
import { toast } from 'sonner';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'all' as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock',
    location: '',
  });

  const { currentTenant } = useTenantStore();
  const { items, loading: isLoading, fetchInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventoryStore();

  useEffect(() => {
    if (currentTenant) {
      fetchInventoryItems();
    }
  }, [currentTenant, fetchInventoryItems]);

  const handleAddItem = async (data: Partial<InventoryItem>) => {
    if (!currentTenant) return;
    
    try {
      await createInventoryItem(data as any);
      toast.success('Inventory item added successfully');
      setShowAddForm(false);
    } catch (_error) {
      toast.error('Failed to add inventory item');
    }
  };

  const handleEditItem = async (data: Partial<InventoryItem>) => {
    if (!currentTenant || !editingItem) return;
    
    try {
      await updateInventoryItem(editingItem.id, data);
      toast.success('Inventory item updated successfully');
      setEditingItem(null);
    } catch (_error) {
      toast.error('Failed to update inventory item');
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!currentTenant) return;
    
    if (await modalService.confirmDanger({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete ${item.name}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })) {
      try {
        await deleteInventoryItem(item.id);
        toast.success('Inventory item deleted successfully');
      } catch (_error) {
        toast.error('Failed to delete inventory item');
      }
    }
  };

  const handleDownloadTemplate = () => {
    const template = ExportFormatter.generateInventoryImportTemplate();
    ExcelParser.exportToExcel(template, 'inventory_template.xlsx', 'Template');
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !item.itemCode.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && item.category !== filters.category) return false;
    if (filters.status !== 'all') {
      const statusMap: Record<string, string> = {
        'in-stock': 'in_stock',
        'low-stock': 'low_stock',
        'out-of-stock': 'out_of_stock'
      };
      if (item.status !== statusMap[filters.status]) return false;
    }
    if (filters.location && item.location !== filters.location) return false;
    return true;
  });

  // Calculate statistics
  const stats = {
    total: items.length,
    inStock: items.filter(i => i.status === 'in_stock').length,
    lowStock: items.filter(i => i.status === 'low_stock').length,
    outOfStock: items.filter(i => i.status === 'out_of_stock').length,
    totalValue: items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0),
  };

  if (showAddForm || editingItem) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingItem ? 'Edit Inventory Item' : 'Add New Item'}
          </h1>
          <p className="text-gray-600 mt-2">
            {editingItem ? 'Update item information' : 'Create a new inventory item'}
          </p>
        </div>

        <InventoryForm
          initialData={editingItem || undefined}
          onSubmit={editingItem ? handleEditItem : handleAddItem}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600 mt-2">Manage laboratory supplies and reagents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/inventory/vendors')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Manage Vendors
            </button>
            <button
              onClick={() => navigate('/inventory/orders')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <InventorySearchFilters filters={filters} onFiltersChange={setFilters} />

      {/* Inventory Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No inventory items found. Add your first item to get started.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <InventoryListTable
            items={filteredItems}
            onEdit={setEditingItem}
            onDelete={handleDeleteItem}
            onView={(item) => navigate(`/inventory/${item.id}`)}
          />
        )}
      </div>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        title="Import/Export Inventory"
        importComponent={<InventoryImport />}
        exportComponent={<InventoryExport />}
        templateDownload={handleDownloadTemplate}
      />
    </div>
  );
};

export default InventoryPage;
