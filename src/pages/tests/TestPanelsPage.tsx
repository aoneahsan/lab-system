import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import {
  useTestPanels,
  useCreateTestPanel,
  useUpdateTestPanel,
  useDeleteTestPanel,
} from '@/hooks/useTests';
import TestPanelForm from '@/components/tests/TestPanelForm';
import type { TestPanel } from '@/types/test.types';

const TestPanelsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPanel, setEditingPanel] = useState<TestPanel | null>(null);

  const { data: panels = [], isLoading } = useTestPanels();
  const createPanelMutation = useCreateTestPanel();
  const updatePanelMutation = useUpdateTestPanel();
  const deleteTestPanelMutation = useDeleteTestPanel();

  const handleAddPanel = async (data: {
    name: string;
    code: string;
    category: string;
    description?: string;
    testIds: string[];
    isActive: boolean;
  }) => {
    await createPanelMutation.mutateAsync({
      name: data.name,
      code: data.code,
      category: data.category,
      description: data.description,
      testIds: data.testIds,
      isActive: data.isActive,
    });
    setShowAddForm(false);
  };

  const handleEditPanel = async (data: {
    name: string;
    code: string;
    category: string;
    description?: string;
    testIds: string[];
    isActive: boolean;
  }) => {
    if (editingPanel) {
      await updatePanelMutation.mutateAsync({
        panelId: editingPanel.id,
        data: {
          name: data.name,
          code: data.code,
          category: data.category,
          description: data.description,
          testIds: data.testIds,
          isActive: data.isActive,
        },
      });
      setEditingPanel(null);
    }
  };

  const handleDeletePanel = async (panel: TestPanel) => {
    if (window.confirm(`Are you sure you want to delete ${panel.name}?`)) {
      await deleteTestPanelMutation.mutateAsync(panel.id);
    }
  };

  if (showAddForm || editingPanel) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingPanel ? 'Edit Test Panel' : 'Create Test Panel'}
          </h1>
          <p className="text-gray-600 mt-2">
            {editingPanel
              ? 'Update panel information'
              : 'Create a new test panel with multiple tests'}
          </p>
        </div>

        <TestPanelForm
          initialData={editingPanel || undefined}
          onSubmit={editingPanel ? handleEditPanel : handleAddPanel}
          onCancel={() => {
            setShowAddForm(false);
            setEditingPanel(null);
          }}
          isLoading={createPanelMutation.isPending || updatePanelMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Panels</h1>
            <p className="text-gray-600 mt-2">Manage test panels and profiles</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Panel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading panels...</p>
        </div>
      ) : panels.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No test panels found. Create your first panel to get started.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create First Panel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((panel) => (
            <div key={panel.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{panel.name}</h3>
                  <p className="text-sm text-gray-600">Code: {panel.code}</p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    panel.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {panel.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Category: <span className="capitalize">{panel.category}</span>
                </p>
                <p className="text-sm text-gray-600">Tests: {panel.testIds.length}</p>
                {panel.totalCost && (
                  <p className="text-sm text-gray-600">Total Cost: ${panel.totalCost.toFixed(2)}</p>
                )}
              </div>

              {panel.description && (
                <p className="text-sm text-gray-700 mb-4">{panel.description}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPanel(panel)}
                  className="flex-1 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePanel(panel)}
                  className="flex-1 px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestPanelsPage;
