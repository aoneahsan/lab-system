import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  AlertCircle,
  ChevronRight,
  User,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface CollectionStats {
  scheduled: number;
  completed: number;
  pending: number;
  successRate: number;
  avgTime: number;
}

interface NextAppointment {
  id: string;
  patientName: string;
  time: string;
  location: string;
  tests: string[];
  priority: 'routine' | 'urgent' | 'stat';
}

export const HomeScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CollectionStats>({
    scheduled: 15,
    completed: 8,
    pending: 7,
    successRate: 98.5,
    avgTime: 4.2,
  });

  const [nextAppointments, setNextAppointments] = useState<NextAppointment[]>([
    {
      id: '1',
      patientName: 'John Doe',
      time: '9:30 AM',
      location: 'Room 101',
      tests: ['CBC', 'Lipid Panel', 'HbA1c'],
      priority: 'routine',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      time: '10:00 AM',
      location: 'Room 102',
      tests: ['Glucose'],
      priority: 'stat',
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      time: '10:30 AM',
      location: 'Ward B-205',
      tests: ['Chemistry Panel', 'PT/INR'],
      priority: 'urgent',
    },
  ]);

  const [routes, setRoutes] = useState([
    { id: '1', name: 'Ward A', collections: 5, completed: 3 },
    { id: '2', name: 'Ward B', collections: 4, completed: 2 },
    { id: '3', name: 'Outpatient', collections: 6, completed: 3 },
  ]);

  const getTimeUntilNext = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(9, 30, 0, 0);
    const diff = next.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes > 0 ? `${minutes} min` : 'Now';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <h2 className="text-xl font-semibold">
            Good morning, {currentUser?.displayName?.split(' ')[0] || 'Phlebotomist'}!
          </h2>
          <p className="text-indigo-100 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-sm text-indigo-100">Collections today</p>
            </div>
            <Activity className="h-12 w-12 text-indigo-200" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <TrendingUp className="h-8 w-8 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            <p className="text-xs text-gray-600">Success</p>
          </div>
        </div>

        {/* Next Appointments */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Next Collections</h3>
              <button
                onClick={() => navigate('/phlebotomist/schedule')}
                className="text-sm text-indigo-600 font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {nextAppointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => navigate(`/phlebotomist/collection/${appointment.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{appointment.patientName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(
                          appointment.priority
                        )}`}
                      >
                        {appointment.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{appointment.tests.join(', ')}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {appointment.time}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {appointment.location}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Routes */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Today's Routes</h3>
          </div>
          <div className="p-4 space-y-3">
            {routes.map((route) => (
              <div key={route.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{route.name}</p>
                    <p className="text-sm text-gray-500">
                      {route.completed} of {route.collections} completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(route.completed / route.collections) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((route.completed / route.collections) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/phlebotomist/scan')}
            className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 hover:bg-gray-50"
          >
            <Package className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-gray-900">Scan Sample</span>
          </button>
          <button
            onClick={() => navigate('/phlebotomist/collections?filter=pending')}
            className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 hover:bg-gray-50"
          >
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-gray-900">Pending Tasks</span>
          </button>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Average Collection Time</p>
              <p className="text-lg font-semibold text-gray-900">{stats.avgTime} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">First Attempt Success</p>
              <p className="text-lg font-semibold text-green-600">{stats.successRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
