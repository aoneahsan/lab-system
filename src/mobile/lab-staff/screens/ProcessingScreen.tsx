import React, { useState } from 'react';
import {
  TestTube,
  Search,
  Clock,
  AlertCircle,
  Package,
  QrCode,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Sample {
  id: string;
  sampleId: string;
  patientName: string;
  patientId: string;
  tests: Array<{
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    analyzer?: string;
    estimatedTime?: number;
  }>;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'received' | 'processing' | 'completed' | 'on-hold';
  receivedTime: Date;
  startTime?: Date;
  completedTime?: Date;
  notes?: string;
}

export const ProcessingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [_selectedSample] = useState<string | null>(null);
  const [, _setShowScanner] = useState(false);

  const [samples] = useState<Sample[]>([
    {
      id: '1',
      sampleId: 'ST2024001',
      patientName: 'John Doe',
      patientId: 'P12345',
      tests: [
        {
          id: '1',
          name: 'CBC',
          status: 'in-progress',
          analyzer: 'Sysmex XN-1000',
          estimatedTime: 5,
        },
        {
          id: '2',
          name: 'Chemistry Panel',
          status: 'pending',
          analyzer: 'Cobas 6000',
          estimatedTime: 15,
        },
      ],
      priority: 'stat',
      status: 'processing',
      receivedTime: new Date(Date.now() - 20 * 60 * 1000),
      startTime: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: '2',
      sampleId: 'ST2024002',
      patientName: 'Mary Johnson',
      patientId: 'P12346',
      tests: [
        {
          id: '3',
          name: 'Lipid Panel',
          status: 'pending',
          analyzer: 'Cobas 6000',
          estimatedTime: 10,
        },
        { id: '4', name: 'HbA1c', status: 'pending', analyzer: 'Variant II', estimatedTime: 3 },
      ],
      priority: 'routine',
      status: 'received',
      receivedTime: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: '3',
      sampleId: 'ST2024003',
      patientName: 'Emma Wilson',
      patientId: 'P12347',
      tests: [
        { id: '5', name: 'TSH', status: 'completed', analyzer: 'Cobas e411' },
        { id: '6', name: 'Free T4', status: 'completed', analyzer: 'Cobas e411' },
      ],
      priority: 'routine',
      status: 'completed',
      receivedTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      startTime: new Date(Date.now() - 90 * 60 * 1000),
      completedTime: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  const filteredSamples = samples.filter((sample) => {
    if (filterStatus !== 'all' && sample.status !== filterStatus) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sample.sampleId.toLowerCase().includes(query) ||
        sample.patientName.toLowerCase().includes(query) ||
        sample.patientId.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'text-red-600';
      case 'urgent':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTimeElapsed = (time: Date) => {
    const minutes = Math.floor((Date.now() - time.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getTestProgress = (tests: Sample['tests']) => {
    const completed = tests.filter((t) => t.status === 'completed').length;
    return `${completed}/${tests.length}`;
  };

  const handleStartProcessing = (sampleId: string) => {
    // Start processing logic
    console.log('Starting processing for:', sampleId);
  };

  const handleScanSample = () => {
    // Implement barcode scanning
    _setShowScanner(true);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Sample Processing</h1>

          {/* Search and Actions */}
          <div className="flex space-x-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by sample ID, patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleScanSample}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <QrCode className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All' },
              { id: 'received', label: 'Received' },
              { id: 'processing', label: 'Processing' },
              { id: 'completed', label: 'Completed' },
              { id: 'on-hold', label: 'On Hold' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  filterStatus === filter.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Samples List */}
      <div className="p-4 space-y-3">
        {filteredSamples.map((sample) => (
          <div key={sample.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4">
              {/* Sample Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{sample.sampleId}</h3>
                    <span className={`text-xs font-semibold ${getPriorityColor(sample.priority)}`}>
                      {sample.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {sample.patientName} • {sample.patientId}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    sample.status
                  )}`}
                >
                  {sample.status}
                </span>
              </div>

              {/* Time Info */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Received: {getTimeElapsed(sample.receivedTime)} ago
                </span>
                {sample.startTime && (
                  <span className="flex items-center">
                    <Play className="h-3 w-3 mr-1" />
                    Started: {getTimeElapsed(sample.startTime)} ago
                  </span>
                )}
              </div>

              {/* Tests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tests</span>
                  <span className="font-medium">{getTestProgress(sample.tests)} completed</span>
                </div>
                {sample.tests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between bg-gray-50 rounded p-2"
                  >
                    <div className="flex items-center space-x-2">
                      {test.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : test.status === 'in-progress' ? (
                        <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : test.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{test.name}</span>
                    </div>
                    <div className="text-right">
                      {test.analyzer && <p className="text-xs text-gray-500">{test.analyzer}</p>}
                      {test.estimatedTime && test.status === 'pending' && (
                        <p className="text-xs text-gray-500">~{test.estimatedTime} min</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {sample.status === 'received' && (
                <button
                  onClick={() => handleStartProcessing(sample.sampleId)}
                  className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Processing</span>
                </button>
              )}

              {sample.status === 'processing' && (
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => navigate(`/lab-staff/sample/${sample.sampleId}/results`)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    Enter Results
                  </button>
                  <button className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                    <Pause className="h-4 w-4" />
                  </button>
                </div>
              )}

              {sample.status === 'completed' && (
                <button
                  onClick={() => navigate(`/lab-staff/sample/${sample.sampleId}/review`)}
                  className="mt-3 w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Results</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredSamples.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No samples found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search' : 'All samples have been processed'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleScanSample}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
      >
        <Package className="h-6 w-6" />
      </button>
    </div>
  );
};
