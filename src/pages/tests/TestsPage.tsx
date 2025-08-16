import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download, Upload, TestTube, BarChart3 } from 'lucide-react';
import {
  useTests,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
  useTestStatistics,
} from '@/hooks/useTests';
import TestListTable from '@/components/tests/TestListTable';
import TestSearchFilters from '@/components/tests/TestSearchFilters';
import TestForm from '@/components/tests/TestForm';
import { ImportExportDialog } from '@/components/data-management/ImportExportDialog';
import { TestCatalogImport } from '@/components/data-management/TestCatalogImport';
import { TestCatalogExport } from '@/components/data-management/TestCatalogExport';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { ExportFormatter } from '@/utils/import-export/export-formatter';
import { ExcelParser } from '@/utils/import-export/excel-parser';
import type { TestDefinition, TestDefinitionFormData, TestFilter } from '@/types/test.types';

const TestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<TestFilter>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTest, setEditingTest] = useState<TestDefinition | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: tests = [], isLoading } = useTests(filters);
  const { data: statistics } = useTestStatistics();
  const createTestMutation = useCreateTest();
  const updateTestMutation = useUpdateTest();
  const deleteTestMutation = useDeleteTest();

  // Check URL params on mount
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setShowAddForm(true);
      // Remove the action param after opening the form
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleAddTest = async (data: TestDefinitionFormData) => {
    await createTestMutation.mutateAsync(data);
    setShowAddForm(false);
  };

  const handleEditTest = async (data: TestDefinitionFormData) => {
    if (editingTest) {
      await updateTestMutation.mutateAsync({
        testId: editingTest.id,
        data,
      });
      setEditingTest(null);
    }
  };

  const handleDeleteTest = async (test: TestDefinition) => {
    if (window.confirm(`Are you sure you want to delete ${test.name}?`)) {
      await deleteTestMutation.mutateAsync(test.id);
    }
  };

  const handleViewTest = (test: TestDefinition) => {
    navigate(`/tests/${test.id}`);
  };

  const handleExport = () => {
    setShowImportExport(true);
  };

  const handleImport = () => {
    setShowImportExport(true);
  };

  const handleDownloadTemplate = () => {
    const template = ExportFormatter.generateTestImportTemplate();
    ExcelParser.exportToExcel(template, 'test_catalog_template.xlsx', 'Template');
  };

  if (showAddForm || editingTest) {
    return (
      <PermissionGate permission={PERMISSIONS.TESTS_MANAGE_CATALOG} hideIfUnauthorized>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {editingTest ? 'Edit Test' : 'Add New Test'}
            </h1>
            <p className="text-gray-600 mt-2">
              {editingTest ? 'Update test information' : 'Create a new laboratory test'}
            </p>
          </div>

          <TestForm
            initialData={
              editingTest
                ? {
                    ...editingTest,
                    loincCode: editingTest.loincCode?.code,
                  }
                : undefined
            }
            onSubmit={editingTest ? handleEditTest : handleAddTest}
            onCancel={() => {
              setShowAddForm(false);
              setEditingTest(null);
            }}
            isLoading={createTestMutation.isPending || updateTestMutation.isPending}
          />
        </div>
      </PermissionGate>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
            <p className="text-gray-600 mt-2">Manage laboratory tests and panels</p>
          </div>
          <div className="flex gap-3">
            <PermissionGate permission={PERMISSIONS.TESTS_CREATE_PANEL} hideIfUnauthorized>
              <button
                onClick={() => navigate('/tests/panels')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Manage Panels
              </button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TESTS_VIEW_ALL} hideIfUnauthorized>
              <button
                onClick={() => navigate('/tests/orders')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Test Orders
              </button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TESTS_MANAGE_CATALOG} hideIfUnauthorized>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TESTS_MANAGE_CATALOG} hideIfUnauthorized>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.TESTS_MANAGE_CATALOG} hideIfUnauthorized>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                data-new-test
              >
                <Plus className="h-4 w-4" />
                Add Test
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <PermissionGate permission={PERMISSIONS.TESTS_VIEW_ALL} hideIfUnauthorized>
        {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalTests}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeTests}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">By Category</p>
              <div className="text-xs space-y-1">
                {Object.entries(statistics.testsByCategory)
                  .slice(0, 3)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex justify-between">
                      <span className="capitalize">{cat}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">By Specimen</p>
              <div className="text-xs space-y-1">
                {Object.entries(statistics.testsBySpecimenType)
                  .slice(0, 3)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </PermissionGate>

      {/* Filters */}
      <TestSearchFilters filters={filters} onFiltersChange={setFilters} />

      {/* Tests Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tests found. Add your first test to get started.</p>
            <PermissionGate permission={PERMISSIONS.TESTS_MANAGE_CATALOG} hideIfUnauthorized>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add First Test
              </button>
            </PermissionGate>
          </div>
        ) : (
          <TestListTable
            tests={tests}
            onEdit={setEditingTest}
            onDelete={handleDeleteTest}
            onView={handleViewTest}
          />
        )}
      </div>

      {/* Import/Export Dialog */}
      <PermissionGate permission={PERMISSIONS.TESTS_MANAGE_CATALOG} hideIfUnauthorized>
        <ImportExportDialog
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          title="Import/Export Test Catalog"
          importComponent={<TestCatalogImport />}
          exportComponent={<TestCatalogExport />}
          templateDownload={handleDownloadTemplate}
        />
      </PermissionGate>
    </div>
  );
};

export default TestsPage;
