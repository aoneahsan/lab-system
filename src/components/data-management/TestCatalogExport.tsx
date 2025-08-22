import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTestStore } from '@/stores/test.store';
import { useTenantStore } from '@/stores/tenant.store';
import { ExcelParser } from '@/utils/import-export/excel-parser';
import { CSVParser } from '@/utils/import-export/csv-parser';
import { ExportFormatter } from '@/utils/import-export/export-formatter';
import { toast } from 'sonner';
import { uiLogger } from '@/services/logger.service';

interface ExportFilters {
  categories: string[];
  activeOnly: boolean;
  includeMetadata: boolean;
  format: 'excel' | 'csv' | 'json';
}

export const TestCatalogExport: React.FC = () => {
  const [filters, setFilters] = useState<ExportFilters>({
    categories: [],
    activeOnly: false,
    includeMetadata: true,
    format: 'excel',
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // TODO: Implement user permission checks
  // const { currentUser } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const { tests, fetchTests } = useTestStore();
  
  useEffect(() => {
    if (currentTenant) {
      fetchTests(currentTenant.id);
    }
  }, [currentTenant, fetchTests]);
  
  useEffect(() => {
    // Extract unique categories
    const categories = [...new Set(tests.map(t => t.category))].sort();
    setAvailableCategories(categories);
  }, [tests]);
  
  const handleExport = async () => {
    if (!currentTenant || tests.length === 0) {
      toast.error('No tests available to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Filter tests
      let filteredTests = [...tests];
      
      if (filters.activeOnly) {
        filteredTests = filteredTests.filter(t => t.isActive);
      }
      
      if (filters.categories.length > 0) {
        filteredTests = filteredTests.filter(t => filters.categories.includes(t.category));
      }
      
      // Format data
      const formattedData = ExportFormatter.formatTestsForExport(filteredTests, {
        format: filters.format,
        includeMetadata: filters.includeMetadata,
      });
      
      // Generate filename
      const filename = ExportFormatter.generateFilename('test_catalog', filters.format);
      
      // Export based on format
      switch (filters.format) {
        case 'excel':
          ExcelParser.exportToExcel(formattedData, filename, 'Tests');
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
      
      toast.success(`Exported ${filteredTests.length} tests successfully`);
    } catch (error) {
      uiLogger.error('Export error:', error);
      toast.error('Failed to export tests');
    } finally {
      setIsExporting(false);
    }
  };
  
  const getFilteredTestCount = () => {
    let count = tests.length;
    
    if (filters.activeOnly) {
      count = tests.filter(t => t.isActive).length;
    }
    
    if (filters.categories.length > 0) {
      count = tests.filter(t => 
        filters.categories.includes(t.category) && 
        (!filters.activeOnly || t.isActive)
      ).length;
    }
    
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
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Export active tests only</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeMetadata}
                onChange={(e) => setFilters({ ...filters, includeMetadata: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Include all metadata (LOINC codes, specimen details, etc.)</span>
            </label>
          </div>
          
          {/* Category Filter */}
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
        </div>
      </div>
      
      {/* Export Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">Ready to Export</p>
            <p className="text-sm text-blue-700">
              {getFilteredTestCount()} tests will be exported
              {filters.includeMetadata ? ' with full metadata' : ''}
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || getFilteredTestCount() === 0}
            loading={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Tests
          </Button>
        </div>
      </div>
    </div>
  );
};