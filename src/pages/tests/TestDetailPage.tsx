import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Clock } from 'lucide-react';
import { useTest, useDeleteTest } from '@/hooks/useTests';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';

const TestDetailPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { data: test, isLoading } = useTest(testId || '');
  const deleteTestMutation = useDeleteTest();

  const handleEdit = () => {
    navigate(`/tests/${testId}/edit`);
  };

  const handleDelete = async () => {
    if (test && window.confirm(`Are you sure you want to delete ${test.name}?`)) {
      await deleteTestMutation.mutateAsync(test.id);
      navigate('/tests');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Test not found</p>
          <button
            onClick={() => navigate('/tests')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tests')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
            <p className="text-gray-600 mt-2">Test Code: {test.code}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{test.category}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{test.department || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Result Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{test.resultType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Unit</dt>
                <dd className="mt-1 text-sm text-gray-900">{test.unit || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {test.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Orderable</dt>
                <dd className="mt-1 text-sm text-gray-900">{test.isOrderable ? 'Yes' : 'No'}</dd>
              </div>
              {test.requiresApproval && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Requires Approval</dt>
                  <dd className="mt-1">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      Yes
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Specimen Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Specimen Requirements</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{test.specimen.type}</dd>
              </div>
              {test.specimen.volume && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Volume</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {test.specimen.volume} {test.specimen.volumeUnit}
                  </dd>
                </div>
              )}
              {test.specimen.container && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Container</dt>
                  <dd className="mt-1 text-sm text-gray-900">{test.specimen.container}</dd>
                </div>
              )}
              {test.specimen.specialInstructions && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Special Instructions</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {test.specimen.specialInstructions}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {/* LOINC Information */}
          {test.loincCode && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">LOINC Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">LOINC Code</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{test.loincCode.code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{test.loincCode.displayName}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Turnaround Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Turnaround Time
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Routine</dt>
                <dd className="mt-1 text-sm text-gray-900">{test.turnaroundTime.routine} hours</dd>
              </div>
              {test.turnaroundTime.stat && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">STAT</dt>
                  <dd className="mt-1 text-sm text-gray-900">{test.turnaroundTime.stat} hours</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Additional Info */}
          {test.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{test.notes}</p>
            </div>
          )}

          {/* Custom Fields */}
          {test.customFields && Object.keys(test.customFields).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h2>
              <CustomFieldsManager
                module="test"
                values={test.customFields}
                readOnly={true}
                showSections={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDetailPage;
