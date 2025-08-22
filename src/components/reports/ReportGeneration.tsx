import { useState } from 'react';
import { Play, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { GeneratedReport, ReportFormat } from '@/types/report.types';
import { format } from 'date-fns';
import { uiLogger } from '@/services/logger.service';

const mockGeneratedReports: GeneratedReport[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    templateId: '1',
    templateName: 'Standard Patient Report',
    format: 'pdf',
    parameters: { orderId: 'ORD-2024-001' },
    fileUrl: '/reports/patient-report-001.pdf',
    status: 'completed',
    generatedBy: 'user1',
    generatedAt: new Date() as any,
  },
  {
    id: '2',
    tenantId: 'tenant1',
    templateId: '2',
    templateName: 'Monthly Summary Report',
    format: 'excel',
    parameters: { month: '2024-03', department: 'chemistry' },
    status: 'generating',
    generatedBy: 'admin',
    generatedAt: new Date() as any,
  },
];

export default function ReportGeneration() {
  const [generatedReports] = useState<GeneratedReport[]>(mockGeneratedReports);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
    generating: { label: 'Generating', color: 'bg-blue-100 text-blue-800', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  };

  const handleGenerateReport = () => {
    uiLogger.log('Generating report:', { selectedTemplate, parameters, format: reportFormat });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a template...</option>
                <option value="1">Standard Patient Report</option>
                <option value="2">Monthly Summary Report</option>
                <option value="3">Daily Summary Report</option>
                <option value="4">Quality Control Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                className="input w-full"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>

          {selectedTemplate && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-900">Report Parameters</h4>

              {selectedTemplate === '1' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                  <input
                    type="text"
                    placeholder="Enter order ID"
                    value={parameters.orderId || ''}
                    onChange={(e) => setParameters({ ...parameters, orderId: e.target.value })}
                    className="input w-full"
                  />
                </div>
              )}

              {selectedTemplate === '2' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <input
                      type="month"
                      value={parameters.month || ''}
                      onChange={(e) => setParameters({ ...parameters, month: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={parameters.department || ''}
                      onChange={(e) => setParameters({ ...parameters, department: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">All Departments</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="hematology">Hematology</option>
                      <option value="microbiology">Microbiology</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={!selectedTemplate}
              className="btn btn-primary"
            >
              <Play className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {generatedReports.map((report) => {
                const status = statusConfig[report.status];
                const StatusIcon = status.icon;

                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{report.templateName}</p>
                        <p className="text-xs text-gray-500">
                          {Object.entries(report.parameters)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(report.format as string).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format((report.generatedAt as any).toDate(), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {report.status === 'completed' && report.fileUrl && (
                        <button className="text-indigo-600 hover:text-indigo-700">
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
