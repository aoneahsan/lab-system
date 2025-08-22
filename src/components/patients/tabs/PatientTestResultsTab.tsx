import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useUrlState, useUrlFilters, useUrlPagination } from '@/hooks/useUrlState';
import { Modal } from '@/components/ui/Modal';
import { uiLogger } from '@/services/logger.service';

interface PatientTestResultsTabProps {
  patientId: string;
}

// Mock data for demonstration
const mockTestResults = [
  {
    id: '1',
    testName: 'Complete Blood Count (CBC)',
    orderDate: new Date('2024-01-15'),
    resultDate: new Date('2024-01-16'),
    status: 'completed',
    critical: false,
    reportUrl: '#'
  },
  {
    id: '2',
    testName: 'Lipid Panel',
    orderDate: new Date('2024-01-10'),
    resultDate: new Date('2024-01-11'),
    status: 'completed',
    critical: false,
    reportUrl: '#'
  },
  {
    id: '3',
    testName: 'HbA1c',
    orderDate: new Date('2024-01-20'),
    resultDate: null,
    status: 'pending',
    critical: false,
    reportUrl: null
  },
  {
    id: '4',
    testName: 'Thyroid Function Test',
    orderDate: new Date('2024-01-18'),
    resultDate: new Date('2024-01-19'),
    status: 'completed',
    critical: true,
    reportUrl: '#'
  }
];

export const PatientTestResultsTab = ({ patientId }: PatientTestResultsTabProps) => {
  const navigate = useNavigate();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // URL state management for filters
  const [filters, setFilters] = useUrlFilters({
    status: null as string | null,
    dateRange: null as string | null,
    testType: null as string | null,
    critical: null as string | null
  });
  
  // URL state for pagination
  const { page, pageSize, sortBy, sortOrder, setPagination } = useUrlPagination(10);
  
  // URL state for view mode
  const [viewMode, setViewMode] = useUrlState('view', {
    defaultValue: 'list',
    removeDefault: true
  });

  // Filter the results based on current filters
  const filteredResults = mockTestResults.filter(result => {
    if (filters.status && result.status !== filters.status) return false;
    if (filters.critical === 'true' && !result.critical) return false;
    if (filters.critical === 'false' && result.critical) return false;
    return true;
  });

  const handleOrderNewTest = () => {
    setShowOrderModal(true);
  };

  const handleViewDetails = (test: any) => {
    setSelectedTest(test);
    setShowDetailsModal(true);
  };

  const handleDownloadReport = (test: any) => {
    // Implementation for downloading report
    uiLogger.log('Downloading report for:', test.testName);
  };

  const handlePrintReport = (test: any) => {
    // Implementation for printing report
    window.print();
  };

  const handleShareReport = (test: any) => {
    // Implementation for sharing report
    uiLogger.log('Sharing report for:', test.testName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'pending':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'processing':
        return 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Test Results</h3>
          <button 
            onClick={handleOrderNewTest}
            className="btn btn-primary"
          >
            Order New Test
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: e.target.value || null })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
          </select>

          <select
            value={filters.critical || ''}
            onChange={(e) => setFilters({ critical: e.target.value || null })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">All Results</option>
            <option value="true">Critical Only</option>
            <option value="false">Normal Only</option>
          </select>

          <select
            value={filters.dateRange || ''}
            onChange={(e) => setFilters({ dateRange: e.target.value || null })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* View Mode Toggle */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="List View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Grid View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {filteredResults.length > 0 ? (
        viewMode === 'list' ? (
          // List View
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {result.testName}
                      </h4>
                      {result.critical && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400">
                          Critical
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Ordered: {format(result.orderDate, 'MMM dd, yyyy')}</span>
                      {result.resultDate && (
                        <span className="ml-4">
                          Resulted: {format(result.resultDate, 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleViewDetails(result)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View Details"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownloadReport(result)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Download Report"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrintReport(result)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Print Report"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShareReport(result)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Share Report"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.732 2.684m4.732-2.684a3 3 0 00-4.732-2.684m0 5.368a3 3 0 10-4.732-2.684" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {result.testName}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      {result.critical && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400">
                          Critical
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Ordered: {format(result.orderDate, 'MMM dd, yyyy')}</div>
                    {result.resultDate && (
                      <div>Resulted: {format(result.resultDate, 'MMM dd, yyyy')}</div>
                    )}
                  </div>
                  
                  {result.status === 'completed' && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleViewDetails(result)}
                        className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadReport(result)}
                        className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No test results found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filters.status || filters.critical || filters.dateRange
              ? 'Try adjusting your filters'
              : 'Test results will appear here once available'}
          </p>
          <div className="mt-6">
            <button 
              onClick={handleOrderNewTest}
              className="btn btn-primary"
            >
              Order First Test
            </button>
          </div>
        </div>
      )}

      {/* Order Test Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order New Test"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Select tests to order for this patient
          </p>
          {/* Add test ordering form here */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowOrderModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle test ordering
                setShowOrderModal(false);
                navigate(`/test-orders/new?patientId=${patientId}`);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700"
            >
              Continue to Order Form
            </button>
          </div>
        </div>
      </Modal>

      {/* Test Details Modal */}
      {selectedTest && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTest(null);
          }}
          title="Test Result Details"
          size="xl"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {selectedTest.testName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Patient ID: {patientId}
              </p>
            </div>
            {/* Add detailed test results here */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-gray-600 dark:text-gray-400">
                Detailed test results would be displayed here...
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePrintReport(selectedTest)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Print
              </button>
              <button
                onClick={() => handleDownloadReport(selectedTest)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};