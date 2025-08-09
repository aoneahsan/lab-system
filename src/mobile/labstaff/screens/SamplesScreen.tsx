import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TestTube2,
  Search,
  
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Barcode,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Sample {
  id: string;
  barcode: string;
  patientName: string;
  patientMrn: string;
  collectionTime: string;
  receivedTime: string;
  tests: string[];
  priority: 'stat' | 'urgent' | 'routine';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  technician?: string;
  notes?: string;
}

export const SamplesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'stat' | 'urgent' | 'routine'>('all');

  const samples: Sample[] = [
    {
      id: 'LAB001',
      barcode: 'B123456789',
      patientName: 'John Doe',
      patientMrn: 'MRN123456',
      collectionTime: '2024-10-27T08:00:00',
      receivedTime: '2024-10-27T08:30:00',
      tests: ['CBC', 'Lipid Panel', 'HbA1c'],
      priority: 'stat',
      status: 'processing',
      technician: 'Sarah J.',
    },
    {
      id: 'LAB002',
      barcode: 'B123456790',
      patientName: 'Jane Smith',
      patientMrn: 'MRN123457',
      collectionTime: '2024-10-27T09:00:00',
      receivedTime: '2024-10-27T09:15:00',
      tests: ['TSH', 'Free T4'],
      priority: 'routine',
      status: 'pending',
    },
    {
      id: 'LAB003',
      barcode: 'B123456791',
      patientName: 'Bob Johnson',
      patientMrn: 'MRN123458',
      collectionTime: '2024-10-27T07:30:00',
      receivedTime: '2024-10-27T08:00:00',
      tests: ['Blood Culture x2'],
      priority: 'urgent',
      status: 'pending',
      notes: 'Patient on antibiotics',
    },
    {
      id: 'LAB004',
      barcode: 'B123456792',
      patientName: 'Mary Wilson',
      patientMrn: 'MRN123459',
      collectionTime: '2024-10-27T06:00:00',
      receivedTime: '2024-10-27T06:30:00',
      tests: ['Glucose', 'Insulin'],
      priority: 'routine',
      status: 'completed',
      technician: 'Mike R.',
    },
  ];

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = 
      sample.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.patientMrn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || sample.status === filterStatus;

    const matchesPriority = 
      filterPriority === 'all' || sample.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <TestTube2 className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Sample Queue</h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredSamples.length} samples in queue
              </p>
            </div>
            <button
              onClick={() => navigate('/labstaff/scan')}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Barcode className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, barcode, or patient..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          {/* Status Filter */}
          <div className="flex space-x-2 overflow-x-auto">
            {(['all', 'pending', 'processing', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex space-x-2 overflow-x-auto">
            {(['all', 'stat', 'urgent', 'routine'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setFilterPriority(priority)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterPriority === priority 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Samples List */}
      <div className="p-4 space-y-3">
        {filteredSamples.map((sample) => (
          <div
            key={sample.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            onClick={() => navigate(`/labstaff/sample/${sample.id}`)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{sample.id}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(sample.priority)}`}>
                      {sample.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{sample.patientName} " {sample.patientMrn}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Barcode className="h-3 w-3" />
                    {sample.barcode}
                  </p>
                </div>
                {getStatusIcon(sample.status)}
              </div>

              {/* Tests */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {sample.tests.map((test, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* Times */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-gray-500">
                  <span>Collected: {format(new Date(sample.collectionTime), 'h:mm a')}</span>
                  <span>Received: {format(new Date(sample.receivedTime), 'h:mm a')}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>

              {/* Status and Technician */}
              <div className="mt-2 flex items-center justify-between">
                <p className={`text-sm font-medium ${getStatusColor(sample.status)}`}>
                  {sample.status.charAt(0).toUpperCase() + sample.status.slice(1)}
                  {sample.technician && ` by ${sample.technician}`}
                </p>
              </div>

              {sample.notes && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  Note: {sample.notes}
                </div>
              )}
            </div>

            {sample.status === 'pending' && (
              <div className="bg-gray-50 px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/labstaff/process/${sample.id}`);
                  }}
                  className="w-full btn btn-primary btn-sm"
                >
                  Start Processing
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSamples.length === 0 && (
        <div className="p-8 text-center">
          <TestTube2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No samples found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};