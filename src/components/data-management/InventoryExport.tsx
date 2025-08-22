import React, { useState, useEffect, useMemo } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInventoryStore } from '@/stores/inventory.store';
import { useTenantStore } from '@/stores/tenant.store';
import { ExcelParser } from '@/utils/import-export/excel-parser';
import { CSVParser } from '@/utils/import-export/csv-parser';
import { ExportFormatter } from '@/utils/import-export/export-formatter';
import { toast } from 'sonner';
import { uiLogger } from '@/services/logger.service';

interface ExportFilters {
  categories: string[];
  locations: string[];
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  includeMetadata: boolean;
  format: 'excel' | 'csv' | 'json';
}

export const InventoryExport: React.FC = () => {
  const [filters, setFilters] = useState<ExportFilters>({
    categories: [],
    locations: [],
    stockStatus: 'all',
    includeMetadata: true,
    format: 'excel',
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // TODO: Implement user permission checks
  // const { currentUser } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const inventoryStore = useInventoryStore();
  const items = useMemo(() => inventoryStore.items || [], [inventoryStore.items]);
  
  useEffect(() => {
    if (currentTenant && inventoryStore.fetchInventoryItems) {
      inventoryStore.fetchInventoryItems();
    }
  }, [currentTenant, inventoryStore]);
  
  useEffect(() => {
    // Extract unique categories and locations
    const categories = [...new Set(items.map(i => i.category))].filter(Boolean).sort();
    const locations: string[] = []; // InventoryItem doesn't have location property
    setAvailableCategories(categories);
    setAvailableLocations(locations);
  }, [items]);
  
  const handleExport = async () => {
    if (!currentTenant || items.length === 0) {
      toast.error('No inventory items available to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Filter items
      let filteredItems = [...items];
      
      // Filter by stock status
      if (filters.stockStatus !== 'all') {
        // Map stock status to actual inventory levels
        filteredItems = filteredItems.filter(i => {
          if (filters.stockStatus === 'in-stock') return i.currentStock > i.minimumStock;
          if (filters.stockStatus === 'low-stock') return i.currentStock <= i.minimumStock && i.currentStock > 0;
          if (filters.stockStatus === 'out-of-stock') return i.currentStock === 0;
          return true;
        });
      }
      
      // Filter by categories
      if (filters.categories.length > 0) {
        filteredItems = filteredItems.filter(i => filters.categories.includes(i.category));
      }
      
      // Filter by locations
      // Location filtering not applicable - InventoryItem doesn't have location
      
      // Format data
      const formattedData = ExportFormatter.formatInventoryForExport(filteredItems, {
        format: filters.format,
        includeMetadata: filters.includeMetadata,
      });
      
      // Generate filename
      const filename = ExportFormatter.generateFilename('inventory', filters.format);
      
      // Export based on format
      switch (filters.format) {
        case 'excel':
          ExcelParser.exportToExcel(formattedData, filename, 'Inventory');
          break;
          
        case 'csv':
          CSVParser.exportToCSV(formattedData, filename);
          break;
          
        case 'json': {
          const jsonData = ExportFormatter.formatJSON(formattedData);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          break;
        }
      }
      
      toast.success(`Exported ${filteredItems.length} inventory items successfully`);
    } catch (error) {
      uiLogger.error('Export error:', error);
      toast.error('Failed to export inventory');
    } finally {
      setIsExporting(false);
    }
  };
  
  const getFilteredItemCount = () => {
    let count = items.length;
    
    if (filters.stockStatus !== 'all') {
      count = items.filter(i => {
        if (filters.stockStatus === 'in-stock') return i.currentStock > i.minimumStock;
        if (filters.stockStatus === 'low-stock') return i.currentStock <= i.minimumStock && i.currentStock > 0;
        if (filters.stockStatus === 'out-of-stock') return i.currentStock === 0;
        return true;
      }).length;
    }
    
    if (filters.categories.length > 0) {
      count = items.filter(i => {
        if (!filters.categories.includes(i.category)) return false;
        if (filters.stockStatus === 'all') return true;
        if (filters.stockStatus === 'in-stock') return i.currentStock > i.minimumStock;
        if (filters.stockStatus === 'low-stock') return i.currentStock <= i.minimumStock && i.currentStock > 0;
        if (filters.stockStatus === 'out-of-stock') return i.currentStock === 0;
        return true;
      }).length;
    }
    
    // Location filtering removed as InventoryItem doesn't have location property
    
    return count;
  };
  
  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-medium mb-4">Export Options</h3>
        
        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilters({ ...filters, format: 'excel' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors
                ${filters.format === 'excel' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'}`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              Excel
            </button>
            <button
              onClick={() => setFilters({ ...filters, format: 'csv' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors
                ${filters.format === 'csv' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'}`}
            >
              <FileText className="h-5 w-5" />
              CSV
            </button>
            <button
              onClick={() => setFilters({ ...filters, format: 'json' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors
                ${filters.format === 'json' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'}`}
            >
              <FileJson className="h-5 w-5" />
              JSON
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="space-y-4">
          {/* Stock Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Status
            </label>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Items</option>
              <option value="in-stock">In Stock Only</option>
              <option value="low-stock">Low Stock Only</option>
              <option value="out-of-stock">Out of Stock Only</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeMetadata}
                onChange={(e) => setFilters({ ...filters, includeMetadata: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Include all metadata (vendor details, expiry dates, etc.)</span>
            </label>
          </div>
          
          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Categories
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ 
                            ...filters, 
                            categories: [...filters.categories, category] 
                          });
                        } else {
                          setFilters({ 
                            ...filters, 
                            categories: filters.categories.filter(c => c !== category) 
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Location Filter */}
          {availableLocations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Locations
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                {availableLocations.map(location => (
                  <label key={location} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(location)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ 
                            ...filters, 
                            locations: [...filters.locations, location] 
                          });
                        } else {
                          setFilters({ 
                            ...filters, 
                            locations: filters.locations.filter(l => l !== location) 
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{location}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Export Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">Ready to Export</p>
            <p className="text-sm text-blue-700">
              {getFilteredItemCount()} items will be exported
              {filters.includeMetadata ? ' with full metadata' : ''}
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || getFilteredItemCount() === 0}
            loading={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Inventory
          </Button>
        </div>
      </div>
    </div>
  );
};