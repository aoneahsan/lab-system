import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
} from 'lucide-react';
import { useReports, useCreateReport, useGenerateReport } from '@/hooks/useReports';
import ReportBuilder from '@/components/reports/ReportBuilder';
import type {
  ReportFormData,
  ReportQueryFilter,
  ReportStatus,
  ReportType,
} from '@/types/report.types';

const ReportsPage: React.FC = () => {
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [filter, setFilter] = useState<ReportQueryFilter>({});

  const { data: reports = [], isLoading } = useReports(filter);
  const createReportMutation = useCreateReport();
  const generateReportMutation = useGenerateReport();

  const handleCreateReport = async (data: ReportFormData) => {
    await createReportMutation.mutateAsync(data);
    setShowReportBuilder(false);
  };

  const handleGenerateReport = (reportId: string) => {
    generateReportMutation.mutate(reportId);
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'generating':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showReportBuilder) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Report</h1>
          <p className="text-gray-600 mt-2">Configure and generate a new report</p>
        </div>

        <ReportBuilder
          onSubmit={handleCreateReport}
          onCancel={() => setShowReportBuilder(false)}
          isLoading={createReportMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-2">Create and manage reports</p>
          </div>
          <button
            onClick={() => setShowReportBuilder(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filter.type || ''}
            onChange={(e) =>
              setFilter({ ...filter, type: (e.target.value as ReportType) || undefined })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="patient_results">Patient Results</option>
            <option value="test_summary">Test Summary</option>
            <option value="qc_summary">QC Summary</option>
            <option value="financial">Financial</option>
            <option value="inventory">Inventory</option>
            <option value="turnaround_time">Turnaround Time</option>
            <option value="workload">Workload</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={filter.status || ''}
            onChange={(e) =>
              setFilter({ ...filter, status: (e.target.value as ReportStatus) || undefined })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="generating">Generating</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reports found.</p>
            <button
              onClick={() => setShowReportBuilder(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create First Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(report.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          {report.description && (
                            <div className="text-sm text-gray-500">{report.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {report.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.createdAt.toDate().toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.createdAt.toDate().toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => (window.location.href = `/reports/${report.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {report.status === 'draft' && (
                        <button
                          onClick={() => handleGenerateReport(report.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          disabled={generateReportMutation.isPending}
                        >
                          <Play className="inline h-4 w-4 mr-1" />
                          Generate
                        </button>
                      )}
                      {report.status === 'completed' && report.output?.fileUrls && (
                        <button className="text-purple-600 hover:text-purple-900">
                          <Download className="inline h-4 w-4 mr-1" />
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
