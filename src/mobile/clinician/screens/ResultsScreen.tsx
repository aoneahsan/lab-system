import React, { useState } from 'react';
import {
  Search,
  Filter,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  Download,
  ChevronRight,
  Clock,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface TestResult {
  id: string;
  patientName: string;
  patientMRN: string;
  testName: string;
  result: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  trend?: 'improving' | 'stable' | 'worsening';
  resultDate: Date;
  reviewed: boolean;
  orderNumber: string;
  previousValue?: string;
}

export const ResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReviewed, setFilterReviewed] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [results] = useState<TestResult[]>([
    {
      id: '1',
      patientName: 'Emma Wilson',
      patientMRN: 'MRN001234',
      testName: 'Troponin I',
      result: '2.5 ng/mL',
      normalRange: '<0.04 ng/mL',
      status: 'critical',
      trend: 'worsening',
      resultDate: new Date(Date.now() - 15 * 60 * 1000),
      reviewed: false,
      orderNumber: 'ORD-2024-0142',
      previousValue: '0.8 ng/mL',
    },
    {
      id: '2',
      patientName: 'James Chen',
      patientMRN: 'MRN001235',
      testName: 'Glucose',
      result: '42 mg/dL',
      normalRange: '70-100 mg/dL',
      status: 'critical',
      resultDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      reviewed: false,
      orderNumber: 'ORD-2024-0141',
    },
    {
      id: '3',
      patientName: 'Sarah Johnson',
      patientMRN: 'MRN001236',
      testName: 'TSH',
      result: '2.5 mIU/L',
      normalRange: '0.4-4.0 mIU/L',
      status: 'normal',
      trend: 'stable',
      resultDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      reviewed: true,
      orderNumber: 'ORD-2024-0140',
      previousValue: '2.3 mIU/L',
    },
    {
      id: '4',
      patientName: 'Michael Brown',
      patientMRN: 'MRN001237',
      testName: 'Hemoglobin',
      result: '18.5 g/dL',
      normalRange: '13.5-17.5 g/dL',
      status: 'abnormal',
      trend: 'improving',
      resultDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      reviewed: true,
      orderNumber: 'ORD-2024-0139',
      previousValue: '19.2 g/dL',
    },
    {
      id: '5',
      patientName: 'Emma Wilson',
      patientMRN: 'MRN001234',
      testName: 'BNP',
      result: '850 pg/mL',
      normalRange: '<100 pg/mL',
      status: 'abnormal',
      trend: 'worsening',
      resultDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      reviewed: false,
      orderNumber: 'ORD-2024-0142',
      previousValue: '620 pg/mL',
    },
  ]);

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      searchQuery === '' ||
      result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.patientMRN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.testName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || result.status === filterStatus;
    const matchesReviewed =
      filterReviewed === 'all' ||
      (filterReviewed === 'reviewed' && result.reviewed) ||
      (filterReviewed === 'unreviewed' && !result.reviewed);

    return matchesSearch && matchesStatus && matchesReviewed;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'abnormal':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worsening':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const markAsReviewed = (resultId: string) => {
    console.log('Marking as reviewed:', resultId);
  };

  const criticalCount = results.filter((r) => r.status === 'critical' && !r.reviewed).length;
  const unreviewed = results.filter((r) => !r.reviewed).length;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Test Results</h1>
            <div className="flex items-center space-x-2">
              {criticalCount > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  {criticalCount} critical
                </span>
              )}
              {unreviewed > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {unreviewed} new
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All Results' },
                { id: 'critical', label: 'Critical' },
                { id: 'abnormal', label: 'Abnormal' },
                { id: 'normal', label: 'Normal' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    filterStatus === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'unreviewed', label: 'Unreviewed' },
                { id: 'reviewed', label: 'Reviewed' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterReviewed(filter.id)}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                    filterReviewed === filter.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="p-4 space-y-3">
        {filteredResults.map((result) => (
          <div
            key={result.id}
            onClick={() => navigate(`/clinician/result/${result.id}`)}
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{result.testName}</h3>
                  {!result.reviewed && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {result.patientName} • {result.patientMRN}
                </p>
              </div>
              {result.status === 'critical' && <AlertCircle className="h-5 w-5 text-red-600" />}
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span
                  className={`text-lg font-bold px-3 py-1 rounded-lg ${getStatusColor(
                    result.status
                  )}`}
                >
                  {result.result}
                </span>
                {result.trend && getTrendIcon(result.trend)}
              </div>
              <span className="text-sm text-gray-500">Ref: {result.normalRange}</span>
            </div>

            {result.previousValue && (
              <p className="text-sm text-gray-600 mb-2">Previous: {result.previousValue}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                {format(result.resultDate, 'MMM d, h:mm a')}
              </span>
              {!result.reviewed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsReviewed(result.id);
                  }}
                  className="flex items-center space-x-1 text-blue-600 font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>Mark Reviewed</span>
                </button>
              )}
              {result.reviewed && (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Reviewed
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredResults.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No results found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search' : 'Results will appear here when available'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/clinician/results/critical')}
            className="flex items-center justify-center space-x-2 py-3 bg-red-50 text-red-600 rounded-lg font-medium"
          >
            <AlertCircle className="h-5 w-5" />
            <span>Critical Only</span>
          </button>
          <button
            onClick={() => navigate('/clinician/results/download')}
            className="flex items-center justify-center space-x-2 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium"
          >
            <Download className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
