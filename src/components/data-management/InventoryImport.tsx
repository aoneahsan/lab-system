import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExcelParser } from '@/utils/import-export/excel-parser';
import { CSVParser } from '@/utils/import-export/csv-parser';
import { DataValidator } from '@/utils/import-export/data-validator';
import { useInventoryStore } from '@/stores/inventory.store';
// TODO: Implement user permission checks
// import { useAuthStore } from '@/stores/auth.store';
import { useTenantStore } from '@/stores/tenant.store';
import { InventoryItem } from '@/types';
import { toast } from 'sonner';
// TODO: Re-enable when implementing expiry date tracking
// import { Timestamp } from 'firebase/firestore';

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'idle' | 'validating' | 'importing' | 'complete' | 'error';
}

export const InventoryImport: React.FC = () => {
  // TODO: Implement file preview functionality
  // const [file, setFile] = useState<File | null>(null);
  // TODO: Implement data preview before import
  // const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    status: 'idle',
  });
  
  // TODO: Implement user-based permissions for inventory import
  // const { currentUser } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const inventoryStore = useInventoryStore();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    // TODO: Store file for preview
    // setFile(file);
    setProgress({ ...progress, status: 'validating' });
    
    try {
      // Parse file
      let data: Record<string, any>[];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const parsed = await ExcelParser.parseFile(file);
        data = parsed.rows;
      } else if (file.name.endsWith('.csv')) {
        const parsed = await CSVParser.parseFile(file);
        data = parsed.rows;
      } else {
        throw new Error('Unsupported file format');
      }
      
      // TODO: Store parsed data for preview
      // setParsedData(data);
      
      // Validate data
      const validation = DataValidator.validate(data, DataValidator.INVENTORY_RULES);
      setValidationResult(validation);
      
      if (validation.isValid) {
        setProgress({ ...progress, status: 'idle', total: validation.validRows.length });
        toast.success(`${validation.validRows.length} items ready to import`);
      } else {
        setProgress({ ...progress, status: 'error' });
        toast.error(`Validation failed: ${validation.errors.length} errors found`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setProgress({ ...progress, status: 'error' });
      toast.error('Failed to parse file');
    }
  }, [progress]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });
  
  const handleImport = async () => {
    if (!validationResult?.validRows.length || !currentTenant) return;
    
    setProgress({
      total: validationResult.validRows.length,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'importing',
    });
    
    for (const item of validationResult.validRows) {
      try {
        // Parse dates if present
        // TODO: Use expiryDate for inventory items with expiration tracking
        // let expiryDate: Timestamp | undefined;
        if (item.expiryDate) {
          const date = new Date(item.expiryDate);
          if (!isNaN(date.getTime())) {
            // expiryDate = Timestamp.fromDate(date);
          }
        }
        
        const inventoryData: Partial<InventoryItem> = {
          name: item.name,
          description: item.description,
          category: item.category,
          manufacturer: item.manufacturer,
          catalogNumber: item.catalogNumber,
          unit: item.unit,
          currentStock: Number(item.quantity) || 0,
          minimumStock: Number(item.reorderLevel) || 0,
          reorderPoint: Number(item.reorderPoint) || Number(item.reorderLevel) || 0,
          reorderQuantity: Number(item.reorderQuantity) || 0,
          unitCost: Number(item.unitCost) || 0,
          preferredVendor: item.vendorName ? {
            id: '',
            name: item.vendorName,
            catalogNumber: item.vendorItemCode
          } : undefined,
          requiresLotTracking: !!item.lotNumber,
          requiresExpirationTracking: !!item.expiryDate,
          isActive: true
        };
        
        if (inventoryStore.createInventoryItem) {
          await inventoryStore.createInventoryItem(inventoryData as any);
        }
        
        setProgress(prev => ({
          ...prev,
          processed: prev.processed + 1,
          successful: prev.successful + 1,
        }));
      } catch (error) {
        console.error('Failed to import item:', error);
        setProgress(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
        }));
      }
    }
    
    setProgress(prev => ({ ...prev, status: 'complete' }));
    toast.success(`Import complete: ${progress.successful} items imported successfully`);
  };
  
  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop your inventory file here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supports Excel (.xlsx, .xls) and CSV files
        </p>
      </div>
      
      {/* Validation Results */}
      {validationResult && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium mb-4">Validation Results</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationResult.validRows.length}
              </div>
              <div className="text-sm text-gray-600">Valid Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {validationResult.errors.length}
              </div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {validationResult.warnings.length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
          
          {validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <h4 className="font-medium text-red-900 mb-2">Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationResult.errors.slice(0, 5).map((error: any, index: number) => (
                  <li key={index}>
                    Row {error.row}: {error.field} - {error.message}
                  </li>
                ))}
                {validationResult.errors.length > 5 && (
                  <li>...and {validationResult.errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Import Progress */}
      {progress.status !== 'idle' && progress.status !== 'error' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium mb-4">Import Progress</h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Processing items...</span>
              <span>{progress.processed} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{progress.successful} Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>{progress.failed} Failed</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Button */}
      {validationResult?.validRows.length > 0 && progress.status === 'idle' && (
        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={!validationResult?.isValid}>
            Import {validationResult.validRows.length} Items
          </Button>
        </div>
      )}
    </div>
  );
};