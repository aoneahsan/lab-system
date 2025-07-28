import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Share2,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useTestResults } from '@/hooks/useTestResults';
import { useAuthStore } from '@/stores/auth.store';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from '@/hooks/useToast';
import type { TestTestResult } from '@/types/result.types';

const MobileTestResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // In real app, would filter by patient ID
  const { data: results = [], isLoading } = useTestResults();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'final':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'preliminary':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return 'text-green-600 bg-green-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'preliminary':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const downloadReport = async (result: TestResult) => {
    try {
      // In real app, would fetch PDF from server
      const pdfBase64 = 'mock-pdf-content';

      const fileName = `LabReport_${result.id}_${Date.now()}.pdf`;

      await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report');
    }
  };

  const shareReport = async (result: TestResult) => {
    try {
      await Share.share({
        title: `Lab Report - ${result.testName}`,
        text: `Here is my lab report from ${new Date(result.resultedAt).toLocaleDateString()}`,
        url: `https://labflow.com/reports/${result.id}`,
        dialogTitle: 'Share your lab report',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const filteredTestResults = results.filter((result) => {
    const matchesSearch = result.testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groupedTestResults = filteredTestResults.reduce(
    (groups, result) => {
      const date = new Date(result.resultedAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(result);
      return groups;
    },
    {} as Record<string, TestResult[]>
  );

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test TestResults</h1>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'final', 'preliminary', 'critical'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TestResults List */}
      <div className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(groupedTestResults).length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No results found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTestResults).map(([date, dateTestResults]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
                <div className="space-y-3">
                  {dateTestResults.map((result) => (
                    <div key={result.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{result.testName}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Ordered by Dr. {result.orderingProvider || 'Smith'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            result.status
                          )}`}
                        >
                          {result.status}
                        </span>
                      </div>

                      {/* TestResult Value */}
                      {result.value && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">TestResult</span>
                            <span className="font-medium text-gray-900">
                              {result.value.numeric} {result.value.unit}
                            </span>
                          </div>
                          {result.referenceRange && (
                            <div className="text-xs text-gray-500 mt-1">
                              Normal: {result.referenceRange.low} - {result.referenceRange.high}{' '}
                              {result.value.unit}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/results/${result.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(result)}
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => shareReport(result)}
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTestResultsPage;
