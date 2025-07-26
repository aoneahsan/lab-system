import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ScheduledCollection {
  id: string;
  time: string;
  patientName: string;
  patientId: string;
  location: string;
  tests: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
  fastingRequired?: boolean;
}

export const ScheduleScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [collections] = useState<ScheduledCollection[]>([
    {
      id: '1',
      time: '08:00',
      patientName: 'Sarah Williams',
      patientId: 'P12345',
      location: 'Ward A - Room 101',
      tests: ['CBC', 'Chemistry Panel'],
      status: 'completed',
      priority: 'routine',
      fastingRequired: true
    },
    {
      id: '2',
      time: '08:30',
      patientName: 'Michael Chen',
      patientId: 'P12346',
      location: 'Ward A - Room 105',
      tests: ['Lipid Panel', 'HbA1c'],
      status: 'completed',
      priority: 'routine'
    },
    {
      id: '3',
      time: '09:00',
      patientName: 'Emma Davis',
      patientId: 'P12347',
      location: 'ICU - Bed 3',
      tests: ['Blood Culture', 'CBC'],
      status: 'in-progress',
      priority: 'stat',
      notes: 'Patient on antibiotics'
    },
    {
      id: '4',
      time: '09:30',
      patientName: 'John Doe',
      patientId: 'P12348',
      location: 'Outpatient - Lab',
      tests: ['Glucose', 'Insulin'],
      status: 'pending',
      priority: 'routine',
      fastingRequired: true
    },
    {
      id: '5',
      time: '10:00',
      patientName: 'Jane Smith',
      patientId: 'P12349',
      location: 'Ward B - Room 202',
      tests: ['PT/INR'],
      status: 'pending',
      priority: 'urgent',
      notes: 'Pre-surgery collection'
    },
    {
      id: '6',
      time: '10:30',
      patientName: 'Robert Johnson',
      patientId: 'P12350',
      location: 'ER - Bed 5',
      tests: ['Troponin', 'BNP', 'CBC'],
      status: 'pending',
      priority: 'stat'
    }
  ]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek(selectedDate);
    return addDays(start, i);
  });

  const filteredCollections = collections.filter(collection => {
    if (filterStatus !== 'all' && collection.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'stat':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const handleStartCollection = (collectionId: string) => {
    navigate(`/phlebotomist/collection/${collectionId}`);
  };

  const getTimeStatus = (time: string, status: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const diff = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (status === 'completed') return null;
    if (status === 'in-progress') return 'In Progress';
    if (diff < 0) return 'Overdue';
    if (diff < 15) return 'Due Soon';
    return null;
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Schedule</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-600"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {/* Week Calendar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-1"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-1"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  isSameDay(day, selectedDate)
                    ? 'bg-indigo-600 text-white'
                    : isSameDay(day, new Date())
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="text-xs font-medium">{format(day, 'EEE')}</p>
                <p className="text-lg font-semibold mt-1">{format(day, 'd')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              {['all', 'pending', 'in-progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                    filterStatus === status
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule List */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredCollections.length} collections
          </span>
        </div>

        {filteredCollections.map((collection) => {
          const timeStatus = getTimeStatus(collection.time, collection.status);
          
          return (
            <div
              key={collection.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">{collection.time}</p>
                      {timeStatus && (
                        <p className={`text-xs mt-1 ${
                          timeStatus === 'Overdue' ? 'text-red-600' :
                          timeStatus === 'Due Soon' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {timeStatus}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{collection.patientName}</p>
                        {getPriorityIcon(collection.priority)}
                      </div>
                      <p className="text-sm text-gray-500">ID: {collection.patientId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(collection.status)}`}>
                    {collection.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{collection.location}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Package className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{collection.tests.join(', ')}</span>
                  </div>
                </div>

                {(collection.notes || collection.fastingRequired) && (
                  <div className="mt-3 space-y-1">
                    {collection.fastingRequired && (
                      <p className="text-xs text-yellow-600 bg-yellow-50 inline-block px-2 py-1 rounded">
                        ⚠️ Fasting required
                      </p>
                    )}
                    {collection.notes && (
                      <p className="text-xs text-gray-500 italic">{collection.notes}</p>
                    )}
                  </div>
                )}

                {collection.status === 'pending' && (
                  <button
                    onClick={() => handleStartCollection(collection.id)}
                    className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                  >
                    Start Collection
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCollections.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No collections scheduled</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterStatus !== 'all' ? 'Try changing the filter' : 'Enjoy your break!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};