import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Report {
  id: string;
  title: string;
  type: 'test-result' | 'summary' | 'invoice' | 'qc-report';
  date: Date;
  status: 'ready' | 'processing' | 'error';
  size: string;
}

const MobileReportsPage: React.FC = () => {
  const [_filterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for reports
  const reports: Report[] = [
    {
      id: '1',
      title: 'Lab Test Results - March 2024',
      type: 'test-result',
      date: new Date(2024, 2, 15),
      status: 'ready',
      size: '2.3 MB'
    },
    {
      id: '2',
      title: 'Monthly Health Summary',
      type: 'summary',
      date: new Date(2024, 2, 1),
      status: 'ready',
      size: '1.5 MB'
    },
    {
      id: '3',
      title: 'Invoice #INV-2024-003',
      type: 'invoice',
      date: new Date(2024, 2, 10),
      status: 'ready',
      size: '0.8 MB'
    },
    {
      id: '4',
      title: 'Quality Control Report',
      type: 'qc-report',
      date: new Date(2024, 2, 5),
      status: 'processing',
      size: '---'
    }
  ];

  const getTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'test-result':
        return 'text-blue-600 bg-blue-50';
      case 'summary':
        return 'text-green-600 bg-green-50';
      case 'invoice':
        return 'text-purple-600 bg-purple-50';
      case 'qc-report':
        return 'text-orange-600 bg-orange-50';
    }
  };

  const getTypeLabel = (type: Report['type']) => {
    switch (type) {
      case 'test-result':
        return 'Test Results';
      case 'summary':
        return 'Summary';
      case 'invoice':
        return 'Invoice';
      case 'qc-report':
        return 'QC Report';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesFilter = selectedFilter === 'all' || report.type === selectedFilter;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleView = (report: Report) => {
    // In production, this would open the report viewer
    console.log('View report:', report.id);
  };

  const handleDownload = (report: Report) => {
    // In production, this would download the report
    console.log('Download report:', report.id);
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600 mt-1">View and download your reports</p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-2">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setSelectedFilter('test-result')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedFilter === 'test-result'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Test Results
            </button>
            <button
              onClick={() => setSelectedFilter('summary')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedFilter === 'summary'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Summaries
            </button>
            <button
              onClick={() => setSelectedFilter('invoice')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedFilter === 'invoice'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 px-4 py-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{report.title}</h3>
                    <div className="flex items-center mt-2 space-x-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {getTypeLabel(report.type)}
                      </span>
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(report.date, 'MMM dd, yyyy')}
                      </div>
                      {report.status === 'ready' && (
                        <span className="text-gray-500">{report.size}</span>
                      )}
                    </div>
                  </div>
                  {report.status === 'ready' ? (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleView(report)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-orange-600 ml-4">
                      Processing...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20" />
    </div>
  );
};

export default MobileReportsPage;
