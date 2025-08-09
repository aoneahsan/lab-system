import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Package, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const stats = [
    { label: 'Collections Today', value: '12', icon: '🩸', color: 'bg-green-100 text-green-800' },
    { label: 'Pending', value: '5', icon: '⏳', color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Completed', value: '7', icon: '✅', color: 'bg-blue-100 text-blue-800' },
    { label: 'Tubes Used', value: '28', icon: '🧪', color: 'bg-purple-100 text-purple-800' },
  ];

  const upcomingCollections = [
    {
      id: '1',
      patientName: 'John Doe',
      time: '9:00 AM',
      location: 'Room 201',
      tests: ['CBC', 'Lipid Panel'],
      priority: 'stat',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      time: '9:30 AM',
      location: 'Room 105',
      tests: ['Glucose', 'HbA1c'],
      priority: 'routine',
    },
    {
      id: '3',
      patientName: 'Bob Johnson',
      time: '10:00 AM',
      location: 'ER Bay 3',
      tests: ['Blood Culture'],
      priority: 'urgent',
    },
  ];

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

  return (
    <div className="flex-1 bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
        <h1 className="text-2xl font-bold">
          Good morning, {currentUser?.firstName || 'Phlebotomist'}!
        </h1>
        <p className="text-indigo-100 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-100">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
            <Calendar className="h-6 w-6 text-indigo-600 mb-2" />
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <button className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
            <MapPin className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-xs font-medium">Routes</span>
          </button>
          <button className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
            <Package className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-xs font-medium">Supplies</span>
          </button>
        </div>

        {/* Upcoming Collections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Collections</h2>
            <button className="text-sm text-indigo-600 font-medium">View All</button>
          </div>

          <div className="space-y-3">
            {upcomingCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-lg shadow-sm p-4"
                onClick={() => navigate(`/phlebotomist/collection/${collection.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{collection.patientName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{collection.time}</span>
                      <MapPin className="h-3 w-3 text-gray-400 ml-2" />
                      <span className="text-sm text-gray-600">{collection.location}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(collection.priority)}`}>
                    {collection.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Tests: {collection.tests.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">Today's Performance</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Collection Success Rate</span>
              <span className="text-sm font-medium text-green-600">95%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Time per Collection</span>
              <span className="text-sm font-medium">8 mins</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Patient Wait Time</span>
              <span className="text-sm font-medium">12 mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};