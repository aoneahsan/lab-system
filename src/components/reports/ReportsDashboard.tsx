import { useState } from 'react';
import { FileText, Download, Calendar, Filter, Plus, Clock, TrendingUp } from 'lucide-react';
import { useReports, useGenerateReport } from '@/hooks/useReports';
import { useUrlState, useUrlFilters } from '@/hooks/useUrlState';
import ReportBuilder from './ReportBuilder';
import ReportTemplates from './ReportTemplates';
import ReportGeneration from './ReportGeneration';
import ReportFilters from './ReportFilters';
import ReportPreview from './ReportPreview';
import ScheduledReports from './ScheduledReports';
import ReportAnalytics from './ReportAnalytics';
import type { ReportFormData } from '@/types/report.types';
import { uiLogger } from '@/services/logger.service';

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useUrlState('tab', {
    defaultValue: 'generate',
    removeDefault: true
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useUrlFilters({});
  
  const { data: reports = [], isLoading } = useReports(filters);
  const generateReport = useGenerateReport();

  const tabs = [
    { id: 'generate', label: 'Generate Report', icon: FileText },
    { id: 'templates', label: 'Report Templates', icon: FileText },
    { id: 'scheduled', label: 'Scheduled Reports', icon: Calendar },
    { id: 'history', label: 'Report History', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const handleGenerateReport = async (data: ReportFormData) => {
    try {
      // TODO: Create report first and then generate it
      // For now, we'll use the template ID if it exists
      const reportId = (data as any).templateId || 'new-report';
      await generateReport.mutateAsync(reportId);
      setShowBuilder(false);
    } catch (error) {
      uiLogger.error('Failed to generate report:', error);
    }
  };

  const getReportStats = () => {
    return {
      totalReports: reports.length,
      generatedToday: reports.filter(r => {
        const today = new Date();
        const reportDate = new Date((r as any).generatedAt);
        return reportDate.toDateString() === today.toDateString();
      }).length,
      scheduledReports: 12, // Mock data
      templatesCount: 8, // Mock data
    };
  };

  const stats = getReportStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate, schedule, and manage laboratory reports</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Report
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Generated Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.generatedToday}</p>
            </div>
            <Download className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled Reports</p>
              <p className="text-2xl font-bold text-purple-600">{stats.scheduledReports}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Report Templates</p>
              <p className="text-2xl font-bold text-orange-600">{stats.templatesCount}</p>
            </div>
            <Filter className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'generate' && (
            <>
              {showBuilder ? (
                <ReportBuilder
                  onSubmit={handleGenerateReport}
                  onCancel={() => setShowBuilder(false)}
                  isLoading={generateReport.isPending}
                />
              ) : (
                <ReportGeneration onGenerateClick={() => setShowBuilder(true)} {...{} as any} />
              )}
            </>
          )}
          
          {activeTab === 'templates' && <ReportTemplates />}
          
          {activeTab === 'scheduled' && <ScheduledReports />}
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              <ReportFilters onFiltersChange={setFilters} filters={filters} />
              <div className="border-t pt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading reports...</p>
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{(report as any).name || 'Report'}</h4>
                            <p className="text-sm text-gray-500">
                              Generated on {new Date((report as any).generatedAt || Date.now()).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {report.format.toUpperCase()}
                            </span>
                            <Download className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && <ReportAnalytics />}
        </div>
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <ReportPreview
          templateId={selectedReport}
          filters={filters}
          onGenerate={(format) => uiLogger.log('Generate in format:', format)}
          isGenerating={generateReport.isPending}
        />
      )}
    </div>
  );
}