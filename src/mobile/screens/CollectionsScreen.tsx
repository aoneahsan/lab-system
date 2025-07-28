import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CollectionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const collections = [
    {
      id: '1',
      patientName: 'John Doe',
      orderNumber: 'ORD-2024-001',
      collectionTime: '09:15 AM',
      status: 'completed',
      tests: 3,
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      orderNumber: 'ORD-2024-002',
      collectionTime: '10:30 AM',
      status: 'completed',
      tests: 2,
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      orderNumber: 'ORD-2024-003',
      collectionTime: '02:00 PM',
      status: 'pending',
      tests: 5,
    },
    {
      id: '4',
      patientName: 'Mary Williams',
      orderNumber: 'ORD-2024-004',
      collectionTime: '03:30 PM',
      status: 'in-progress',
      tests: 1,
    },
  ];

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch =
      collection.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || collection.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Collections</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Collections List */}
      <div className="space-y-3">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No collections found</div>
        ) : (
          filteredCollections.map((collection) => (
            <div
              key={collection.id}
              onClick={() => navigate(`/phlebotomist/collection/${collection.id}`)}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{collection.patientName}</h3>
                  <p className="text-sm text-gray-600">{collection.orderNumber}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(collection.status)}
                  <span className="text-sm font-medium text-gray-700">
                    {getStatusText(collection.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{collection.collectionTime}</span>
                  </span>
                  <span>{collection.tests} tests</span>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/phlebotomist/scan')}
        className="fixed bottom-20 right-4 bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition-colors"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default CollectionsScreen;
