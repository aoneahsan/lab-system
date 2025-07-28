import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
  Filter,
  Search,
  ChevronRight,
  MoreVertical,
  Droplet,
  TestTube,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Collection {
  id: string;
  orderId: string;
  patientName: string;
  patientId: string;
  location: string;
  tests: Array<{
    name: string;
    tubeType: string;
    tubeColor: string;
    volume: number;
    collected: boolean;
  }>;
  status: 'pending' | 'in-progress' | 'collected' | 'sent-to-lab';
  priority: 'routine' | 'urgent' | 'stat';
  collectionTime?: Date;
  notes?: string;
  specialInstructions?: string;
}

export const CollectionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const [collections] = useState<Collection[]>([
    {
      id: '1',
      orderId: 'ORD001',
      patientName: 'John Doe',
      patientId: 'P12348',
      location: 'Outpatient Lab',
      tests: [
        { name: 'CBC', tubeType: 'EDTA', tubeColor: 'purple', volume: 3, collected: false },
        {
          name: 'Chemistry Panel',
          tubeType: 'SST',
          tubeColor: 'gold',
          volume: 5,
          collected: false,
        },
      ],
      status: 'pending',
      priority: 'routine',
      specialInstructions: 'Patient has difficult veins',
    },
    {
      id: '2',
      orderId: 'ORD002',
      patientName: 'Emma Davis',
      patientId: 'P12347',
      location: 'ICU - Bed 3',
      tests: [
        {
          name: 'Blood Culture',
          tubeType: 'Culture Bottle',
          tubeColor: 'blue',
          volume: 10,
          collected: true,
        },
        { name: 'CBC', tubeType: 'EDTA', tubeColor: 'purple', volume: 3, collected: false },
      ],
      status: 'in-progress',
      priority: 'stat',
      notes: 'Collect from central line',
    },
    {
      id: '3',
      orderId: 'ORD003',
      patientName: 'Sarah Williams',
      patientId: 'P12345',
      location: 'Ward A - Room 101',
      tests: [
        { name: 'Lipid Panel', tubeType: 'SST', tubeColor: 'gold', volume: 5, collected: true },
        { name: 'HbA1c', tubeType: 'EDTA', tubeColor: 'purple', volume: 3, collected: true },
      ],
      status: 'collected',
      priority: 'routine',
      collectionTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '4',
      orderId: 'ORD004',
      patientName: 'Michael Chen',
      patientId: 'P12346',
      location: 'Ward B - Room 205',
      tests: [
        {
          name: 'PT/INR',
          tubeType: 'Citrate',
          tubeColor: 'light-blue',
          volume: 2.7,
          collected: true,
        },
      ],
      status: 'sent-to-lab',
      priority: 'urgent',
      collectionTime: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  const filteredCollections = collections.filter((collection) => {
    if (activeFilter !== 'all' && collection.status !== activeFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        collection.patientName.toLowerCase().includes(query) ||
        collection.patientId.toLowerCase().includes(query) ||
        collection.orderId.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'in-progress':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case 'collected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'sent-to-lab':
        return <Package className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTubeColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500',
      gold: 'bg-yellow-500',
      'light-blue': 'bg-blue-300',
      blue: 'bg-blue-600',
      red: 'bg-red-500',
      green: 'bg-green-500',
      gray: 'bg-gray-500',
    };
    return colorMap[color] || 'bg-gray-400';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getCompletedTests = (tests: Collection['tests']) => {
    const completed = tests.filter((t) => t.collected).length;
    return `${completed}/${tests.length}`;
  };

  const handleCollectionAction = (collection: Collection) => {
    if (collection.status === 'pending' || collection.status === 'in-progress') {
      navigate(`/phlebotomist/collection/${collection.id}`);
    } else {
      navigate(`/phlebotomist/collection/${collection.id}/view`);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Collections</h1>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'collected', label: 'Collected' },
              { id: 'sent-to-lab', label: 'Sent' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  activeFilter === filter.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="p-4 space-y-3">
        {filteredCollections.map((collection) => (
          <div
            key={collection.id}
            onClick={() => handleCollectionAction(collection)}
            className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(collection.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{collection.patientName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(
                          collection.priority
                        )}`}
                      >
                        {collection.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {collection.patientId} • Order: {collection.orderId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCollection(collection.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{collection.location}</span>
              </div>

              {/* Tests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tests</span>
                  <span className="font-medium text-gray-900">
                    {getCompletedTests(collection.tests)} collected
                  </span>
                </div>
                <div className="flex space-x-2">
                  {collection.tests.map((test, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <div
                        className={`h-3 w-3 rounded-full ${getTubeColorClass(test.tubeColor)} ${
                          test.collected ? '' : 'opacity-40'
                        }`}
                      />
                      <span
                        className={`text-xs ${test.collected ? 'text-gray-700' : 'text-gray-400'}`}
                      >
                        {test.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {(collection.notes || collection.specialInstructions) && (
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {collection.notes || collection.specialInstructions}
                </div>
              )}

              {/* Collection Time */}
              {collection.collectionTime && (
                <p className="mt-3 text-xs text-gray-500">
                  Collected {format(collection.collectionTime, 'h:mm a')}
                </p>
              )}

              {/* Action Button */}
              {(collection.status === 'pending' || collection.status === 'in-progress') && (
                <div className="mt-3 flex items-center justify-end">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredCollections.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No collections found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search' : 'All collections are complete'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
