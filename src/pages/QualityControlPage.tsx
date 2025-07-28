import React, { useState } from 'react';
import {
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useQCDashboard, useQCRuns, useCreateQCRun } from '@/hooks/useQC';
import QCRunForm from '@/components/qc/QCRunForm';
import type { QCRunFormData, QCFilter } from '@/types/qc.types';

const QualityControlPage: React.FC = () => {
  const [showRunForm, setShowRunForm] = useState(false);
  const [filter] = useState<QCFilter>({});

  const { data: dashboard } = useQCDashboard();
  const { data: runs = [], isLoading: runsLoading } = useQCRuns(filter);
  // const { data: materials = [] } = useQCMaterials();
  const createRunMutation = useCreateQCRun();

  const handleCreateRun = async (data: QCRunFormData) => {
    await createRunMutation.mutateAsync(data);
    setShowRunForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'accepted':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (showRunForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New QC Run</h1>
          <p className="text-gray-600 mt-2">Enter quality control results</p>
        </div>

        <QCRunForm
          onSubmit={handleCreateRun}
          onCancel={() => setShowRunForm(false)}
          isLoading={createRunMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
            <p className="text-gray-600 mt-2">Monitor and manage QC runs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = '/quality-control/materials')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Package className="inline h-4 w-4 mr-1" />
              Materials
            </button>
            <button
              onClick={() => setShowRunForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New QC Run
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.totalRuns}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboard.passRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failure Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboard.failureRate.toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboard.pendingReview}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {dashboard && dashboard.expiringMaterials.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Expiring Materials</h3>
              <ul className="mt-1 text-sm text-yellow-800">
                {dashboard.expiringMaterials.slice(0, 3).map((material) => (
                  <li key={material.id}>
                    {material.name} (Lot: {material.lotNumber}) - Expires in{' '}
                    {material.daysUntilExpiration} days
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recent QC Runs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Recent QC Runs</h2>
        </div>

        {runsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading QC runs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No QC runs found.</p>
            <button
              onClick={() => setShowRunForm(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create First QC Run
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{run.runNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{run.materialName}</div>
                      <div className="text-sm text-gray-500">Lot: {run.materialLot}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {run.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.runDate.toDate().toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{run.shift} shift</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {run.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.results.filter((r) => r.status === 'pass').length}/{run.results.length}{' '}
                        passed
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => (window.location.href = `/quality-control/runs/${run.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {run.status === 'completed' && !run.reviewedBy && (
                        <button className="text-purple-600 hover:text-purple-900">Review</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test Performance Summary */}
      {dashboard && dashboard.byTest.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Test Performance Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.byTest.slice(0, 6).map((test) => (
                <div key={test.testCode} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{test.testName}</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pass Rate:</span>
                      <span
                        className={`font-medium ${
                          test.passRate >= 95
                            ? 'text-green-600'
                            : test.passRate >= 90
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {test.passRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CV:</span>
                      <span className="font-medium">{test.cv.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Runs:</span>
                      <span className="font-medium">{test.runs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControlPage;
