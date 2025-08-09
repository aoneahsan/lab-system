import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Edit3,
  ChevronRight,
} from 'lucide-react';

interface TestResult {
  id: string;
  patientName: string;
  patientId: string;
  testName: string;
  orderId: string;
  priority: 'routine' | 'urgent' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'validated';
  collectedAt: Date;
  tat: string;
  criticalFlag?: boolean;
}

const LabStaffResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [_statusFilter] = useState<'all' | 'pending' | 'critical'>('all');
  const [_selectedResult] = useState<string | null>(null);

  // Mock data - in real app would fetch from API
  const [results] = useState<TestResult[]>([
    {
      id: '1',
      patientName: 'John Doe',
      patientId: 'P12345',
      testName: 'Complete Blood Count',
      orderId: 'ORD-001',
      priority: 'routine',
      status: 'pending',
      collectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      tat: '2h 15m',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientId: 'P12346',
      testName: 'Glucose, Fasting',
      orderId: 'ORD-002',
      priority: 'critical',
      status: 'in_progress',
      collectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      tat: '1h 5m',
      criticalFlag: true,
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      patientId: 'P12347',
      testName: 'Lipid Panel',
      orderId: 'ORD-003',
      priority: 'urgent',
      status: 'pending',
      collectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      tat: '3h 30m',
    },
  ]);

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.orderId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'pending' && result.status === 'pending') ||
      (selectedFilter === 'critical' && result.criticalFlag);

    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: TestResult['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'urgent':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'completed':
      case 'validated':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Edit3 className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleResultClick = (resultId: string) => {
    // Navigate to result entry page
    navigate(`/results/entry/${resultId}`);
  };

  const filterOptions = [
    { value: 'all', label: 'All Results', count: results.length },
    {
      value: 'pending',
      label: 'Pending',
      count: results.filter((r) => r.status === 'pending').length,
    },
    { value: 'critical', label: 'Critical', count: results.filter((r) => r.criticalFlag).length },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Results</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient, test, or order ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value as any)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFilter === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {option.label}
              <span
                className={`text-xs ${
                  selectedFilter === option.value ? 'text-purple-200' : 'text-gray-500'
                }`}
              >
                ({option.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 px-6 py-4 space-y-3">
        {filteredResults.map((result) => (
          <div
            key={result.id}
            onClick={() => handleResultClick(result.id)}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{result.patientName}</h3>
                  {result.criticalFlag && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
                <p className="text-sm text-gray-600">ID: {result.patientId}</p>
              </div>
              {getStatusIcon(result.status)}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{result.testName}</p>
              <div className="flex items-center gap-4 text-xs">
                <span
                  className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(
                    result.priority
                  )}`}
                >
                  {result.priority.toUpperCase()}
                </span>
                <span className="text-gray-500">Order: {result.orderId}</span>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {result.tat}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Collected: {result.collectedAt.toLocaleTimeString()}
              </p>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredResults.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabStaffResultsPage;
