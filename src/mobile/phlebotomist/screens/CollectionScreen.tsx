import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  QrCode,
  Printer,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface Collection {
  id: string;
  patientName: string;
  patientId: string;
  time: string;
  location: string;
  tests: Array<{
    name: string;
    code: string;
    tubeType: string;
    tubeColor: string;
    volume: string;
  }>;
  priority: 'stat' | 'urgent' | 'routine';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  specialInstructions?: string;
}

export const CollectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const collections: Collection[] = [
    {
      id: '1',
      patientName: 'John Doe',
      patientId: 'P12345',
      time: '9:00 AM',
      location: 'Room 201',
      tests: [
        { name: 'Complete Blood Count', code: 'CBC', tubeType: 'EDTA', tubeColor: 'purple', volume: '3ml' },
        { name: 'Lipid Panel', code: 'LIPID', tubeType: 'SST', tubeColor: 'gold', volume: '5ml' },
      ],
      priority: 'stat',
      status: 'pending',
      specialInstructions: 'Patient is fasting since 12 hours',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientId: 'P12346',
      time: '9:30 AM',
      location: 'Room 105',
      tests: [
        { name: 'Glucose', code: 'GLU', tubeType: 'Fluoride', tubeColor: 'gray', volume: '2ml' },
        { name: 'HbA1c', code: 'HBA1C', tubeType: 'EDTA', tubeColor: 'purple', volume: '3ml' },
      ],
      priority: 'routine',
      status: 'pending',
    },
    {
      id: '3',
      patientName: 'Bob Johnson',
      patientId: 'P12347',
      time: '8:30 AM',
      location: 'ER Bay 3',
      tests: [
        { name: 'Blood Culture', code: 'BC', tubeType: 'Blood Culture', tubeColor: 'blue', volume: '10ml' },
      ],
      priority: 'urgent',
      status: 'completed',
    },
  ];

  const filteredCollections = collections.filter(c => 
    activeTab === 'pending' ? c.status !== 'completed' : c.status === 'completed'
  );

  const getTubeColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500',
      gold: 'bg-yellow-500',
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
    };
    return colorMap[color] || 'bg-gray-400';
  };

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
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Pending ({collections.filter(c => c.status !== 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Completed ({collections.filter(c => c.status === 'completed').length})
            </button>
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="p-4 space-y-3">
        {filteredCollections.length > 0 ? (
          filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
              onClick={() => setSelectedCollection(collection)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{collection.patientName}</h3>
                    <p className="text-sm text-gray-500">ID: {collection.patientId}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{collection.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{collection.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(collection.priority)}`}>
                      {collection.priority.toUpperCase()}
                    </span>
                    {getStatusIcon(collection.status)}
                  </div>
                </div>

                {/* Tube Requirements */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Required Tubes:</p>
                  <div className="flex flex-wrap gap-2">
                    {collection.tests.map((test, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                        <div className={`w-3 h-3 rounded-full ${getTubeColorClass(test.tubeColor)}`} />
                        <span className="text-sm text-gray-700">
                          {test.tubeType} ({test.volume})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {collection.specialInstructions && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg flex items-start gap-2">
                    <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{collection.specialInstructions}</p>
                  </div>
                )}

                {collection.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/phlebotomist/collection/${collection.id}/start`);
                      }}
                      className="flex-1 btn btn-primary btn-sm"
                    >
                      Start Collection
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle print labels
                      }}
                      className="btn btn-outline btn-sm flex items-center gap-1"
                    >
                      <Printer className="h-4 w-4" />
                      Labels
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              No {activeTab} collections
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'pending' 
                ? 'All collections have been completed'
                : 'Complete some collections to see them here'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">Today's Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">7</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">5</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">1</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};