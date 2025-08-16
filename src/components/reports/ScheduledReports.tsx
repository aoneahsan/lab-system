import React, { useState } from 'react';
import { Calendar, Clock, Mail, Download, Plus, Edit2, Trash2, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { modalService } from '@/services/modalService';

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  lastRun?: Date;
  nextRun: Date;
  status: 'active' | 'paused';
  filters?: {
    department?: string;
    testType?: string;
    dateRange?: 'last7days' | 'last30days' | 'lastMonth';
  };
}

export default function ScheduledReports() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);

  // Mock scheduled reports
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Daily Test Summary',
      template: 'daily-summary',
      schedule: {
        frequency: 'daily',
        time: '08:00'
      },
      recipients: ['lab.director@labflow.com', 'quality@labflow.com'],
      format: 'pdf',
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 8 * 60 * 60 * 1000),
      status: 'active',
      filters: {
        dateRange: 'last7days'
      }
    },
    {
      id: '2',
      name: 'Weekly QC Report',
      template: 'qc-summary',
      schedule: {
        frequency: 'weekly',
        time: '09:00',
        dayOfWeek: 1 // Monday
      },
      recipients: ['quality@labflow.com'],
      format: 'excel',
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'active',
      filters: {
        department: 'Chemistry'
      }
    },
    {
      id: '3',
      name: 'Monthly Financial Report',
      template: 'financial-summary',
      schedule: {
        frequency: 'monthly',
        time: '10:00',
        dayOfMonth: 1
      },
      recipients: ['cfo@labflow.com', 'billing@labflow.com'],
      format: 'excel',
      lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'paused',
      filters: {
        dateRange: 'lastMonth'
      }
    }
  ]);

  const handleToggleStatus = (reportId: string) => {
    setScheduledReports(reports =>
      reports.map(report =>
        report.id === reportId
          ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
          : report
      )
    );
  };

  const handleDelete = async (reportId: string) => {
    if (await modalService.confirmDanger({
      title: 'Delete Scheduled Report',
      message: 'Are you sure you want to delete this scheduled report?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })) {
      setScheduledReports(reports => reports.filter(report => report.id !== reportId));
    }
  };

  const getFrequencyDescription = (schedule: ScheduledReport['schedule']) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${days[schedule.dayOfWeek || 0]} at ${schedule.time}`;
      }
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${schedule.time}`;
      default:
        return 'Unknown schedule';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure automatic report generation and delivery
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </button>
      </div>

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {scheduledReports.map((report) => (
          <div
            key={report.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-lg font-medium">{report.name}</h4>
                  {report.status === 'active' ? (
                    <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      Paused
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      {getFrequencyDescription(report.schedule)}
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Mail className="h-4 w-4 mr-2" />
                      {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Download className="h-4 w-4 mr-2" />
                      Format: {report.format.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    {report.lastRun && (
                      <div className="text-gray-600 mb-2">
                        <span className="font-medium">Last run:</span>{' '}
                        {format(report.lastRun, 'MMM dd, yyyy HH:mm')}
                      </div>
                    )}
                    <div className="text-gray-600 mb-2">
                      <span className="font-medium">Next run:</span>{' '}
                      {format(report.nextRun, 'MMM dd, yyyy HH:mm')}
                    </div>
                    {report.filters && Object.keys(report.filters).length > 0 && (
                      <div className="text-gray-600">
                        <span className="font-medium">Filters:</span>{' '}
                        {Object.keys(report.filters).length} active
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleToggleStatus(report.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    report.status === 'active'
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={report.status === 'active' ? 'Pause' : 'Resume'}
                >
                  {report.status === 'active' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {scheduledReports.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No scheduled reports configured</p>
            <p className="text-sm text-gray-500 mt-1">
              Create a schedule to automatically generate and send reports
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || selectedReport) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {selectedReport ? 'Edit Scheduled Report' : 'Create New Schedule'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Daily Test Summary"
                  defaultValue={selectedReport?.name}
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Template
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  defaultValue={selectedReport?.template}
                >
                  <option value="daily-summary">Daily Summary</option>
                  <option value="test-results">Test Results</option>
                  <option value="qc-summary">Quality Control Summary</option>
                  <option value="financial-summary">Financial Summary</option>
                  <option value="patient-report">Patient Report</option>
                </select>
              </div>

              {/* Schedule Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    defaultValue={selectedReport?.schedule.frequency || 'daily'}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                    type="time"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    defaultValue={selectedReport?.schedule.time || '08:00'}
                  />
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Enter email addresses, one per line"
                  defaultValue={selectedReport?.recipients.join('\n')}
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      defaultChecked={!selectedReport || selectedReport.format === 'pdf'}
                      className="mr-2"
                    />
                    PDF
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      defaultChecked={selectedReport?.format === 'excel'}
                      className="mr-2"
                    />
                    Excel
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      defaultChecked={selectedReport?.format === 'csv'}
                      className="mr-2"
                    />
                    CSV
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedReport(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedReport(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {selectedReport ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}