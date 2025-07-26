import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isFuture, isToday } from 'date-fns';

interface Appointment {
  id: string;
  testName: string;
  testCode: string;
  date: Date;
  time: string;
  location: string;
  address: string;
  doctorName: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  preparationInstructions?: string;
  confirmationCode: string;
  canReschedule: boolean;
  canCancel: boolean;
}

export const AppointmentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Mock data - replace with actual API call
  const appointments: Appointment[] = [
    {
      id: '1',
      testName: 'Lipid Panel',
      testCode: 'LIPID',
      date: new Date('2024-10-27'),
      time: '9:00 AM',
      location: 'LabFlow Main Lab',
      address: '123 Medical Center Dr, City, State',
      doctorName: 'Dr. Smith',
      status: 'scheduled',
      preparationInstructions: 'Fast for 12 hours before the test. Water is allowed.',
      confirmationCode: 'LF-2024-1027',
      canReschedule: true,
      canCancel: true
    },
    {
      id: '2',
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      date: new Date('2024-10-25'),
      time: '2:30 PM',
      location: 'Downtown Collection Center',
      address: '456 Health Plaza, City, State',
      doctorName: 'Dr. Johnson',
      status: 'completed',
      confirmationCode: 'LF-2024-1025',
      canReschedule: false,
      canCancel: false
    },
    {
      id: '3',
      testName: 'Thyroid Function Test',
      testCode: 'TFT',
      date: new Date('2024-10-20'),
      time: '11:00 AM',
      location: 'LabFlow Main Lab',
      address: '123 Medical Center Dr, City, State',
      doctorName: 'Dr. Smith',
      status: 'cancelled',
      confirmationCode: 'LF-2024-1020',
      canReschedule: false,
      canCancel: false
    }
  ];

  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'scheduled' && isFuture(apt.date)
  );

  const pastAppointments = appointments.filter(
    apt => apt.status !== 'scheduled' || isPast(apt.date)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'missed':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'missed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const isUpcoming = appointment.status === 'scheduled' && isFuture(appointment.date);
    const isNextAppointment = isUpcoming && upcomingAppointments[0]?.id === appointment.id;

    return (
      <div
        key={appointment.id}
        onClick={() => navigate(`/patient/appointments/${appointment.id}`)}
        className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer ${
          isNextAppointment ? 'ring-2 ring-indigo-500' : ''
        }`}
      >
        {isNextAppointment && (
          <div className="bg-indigo-500 text-white px-4 py-2 text-sm font-medium">
            Next Appointment
          </div>
        )}
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-gray-900">{appointment.testName}</h3>
              <p className="text-sm text-gray-500">Code: {appointment.testCode}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              getStatusColor(appointment.status)
            }`}>
              {getStatusIcon(appointment.status)}
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {format(appointment.date, 'EEEE, MMM dd, yyyy')}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              {appointment.time}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              {appointment.location}
            </div>
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              {appointment.doctorName}
            </div>
          </div>

          {appointment.preparationInstructions && isUpcoming && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">Preparation Required</p>
              <p className="text-xs text-amber-700 mt-1">
                {appointment.preparationInstructions}
              </p>
            </div>
          )}

          {isUpcoming && (
            <div className="mt-4 flex space-x-2">
              {appointment.canReschedule && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patient/appointments/${appointment.id}/reschedule`);
                  }}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                >
                  Reschedule
                </button>
              )}
              {appointment.canCancel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle cancellation
                  }}
                  className="flex-1 py-2 px-3 border border-red-300 rounded-lg text-sm font-medium text-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Appointments</h1>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'upcoming' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'past' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              Past ({pastAppointments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'upcoming' ? (
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(renderAppointmentCard)
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming appointments</p>
                <p className="text-sm text-gray-400 mt-1">
                  Book a test to get started
                </p>
                <button
                  onClick={() => navigate('/patient/appointments/new')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                >
                  Book Appointment
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map(renderAppointmentCard)
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No past appointments</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your appointment history will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/patient/appointments/new')}
        className="fixed bottom-20 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};