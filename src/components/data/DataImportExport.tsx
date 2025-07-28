import React, { useState } from 'react';
import { dataExportService } from '../../services/dataExport';
import type { ExportOptions, ImportOptions } from '../../services/dataExport';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const collections = [
  { value: 'patients', label: 'Patients' },
  { value: 'tests', label: 'Tests' },
  { value: 'samples', label: 'Samples' },
  { value: 'results', label: 'Results' },
  { value: 'orders', label: 'Orders' },
  { value: 'billing', label: 'Billing' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'users', label: 'Users' },
];

const DataImportExport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json' | 'pdf'>('excel');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCollection, setImportCollection] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'excel' | 'json'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExport = async () => {
    if (selectedCollections.length === 0) {
      alert('Please select at least one collection to export');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const options: ExportOptions = {
        format: exportFormat,
        includeMetadata: true,
      };

      if (selectedCollections.length === 1) {
        await dataExportService.exportData(selectedCollections[0], options);
      } else {
        await dataExportService.exportMultiple(selectedCollections, options);
      }

      setResult({
        success: true,
        message: `Successfully exported ${selectedCollections.length} collection(s)`,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Export failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importCollection) {
      alert('Please select a file and collection');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const options: ImportOptions = {
        format: importFormat,
        validation: true,
        batchSize: 100,
      };

      const importResult = await dataExportService.importData(
        importCollection,
        importFile,
        options
      );

      setResult(importResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Import failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Auto-detect format based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') setImportFormat('csv');
      else if (extension === 'xlsx' || extension === 'xls') setImportFormat('excel');
      else if (extension === 'json') setImportFormat('json');
    }
  };

  const toggleCollection = (collection: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collection) ? prev.filter((c) => c !== collection) : [...prev, collection]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowDownTrayIcon className="inline-block w-5 h-5 mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowUpTrayIcon className="inline-block w-5 h-5 mr-2" />
              Import Data
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select Collections to Export
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {collections.map((collection) => (
                    <label
                      key={collection.value}
                      className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection.value)}
                        onChange={() => toggleCollection(collection.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{collection.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>

              <button
                onClick={handleExport}
                disabled={isProcessing || selectedCollections.length === 0}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Export Data
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File to Import
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.json"
                          onChange={handleFileSelect}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, Excel, or JSON up to 10MB</p>
                  </div>
                </div>
                {importFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {importFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import to Collection
                </label>
                <select
                  value={importCollection}
                  onChange={(e) => setImportCollection(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a collection</option>
                  {collections.map((collection) => (
                    <option key={collection.value} value={collection.value}>
                      {collection.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleImport}
                disabled={isProcessing || !importFile || !importCollection}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Import Data
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                {result.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.success ? 'Success' : 'Error'}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {result.message || (
                      <>
                        {result.imported && `Imported: ${result.imported} records`}
                        {result.failed > 0 && ` | Failed: ${result.failed} records`}
                      </>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <ul className="mt-2 list-disc list-inside">
                        {result.errors.slice(0, 5).map((error: any, index: number) => (
                          <li key={index}>{error.message || error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>...and {result.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImportExport;
