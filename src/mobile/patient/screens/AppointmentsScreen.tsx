import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  type: string;
  date: Date;
  time: string;
  location: string;
  doctor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  tests: string[];
}

export const AppointmentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Mock data
  const appointments: Appointment[] = [
    {
      id: '1',
      type: 'Blood Test Collection',
      date: new Date('2024-10-27'),
      time: '9:00 AM',
      location: 'Main Lab',
      doctor: 'Dr. Smith',
      status: 'upcoming',
      tests: ['Complete Blood Count', 'Lipid Panel'],
    },
    {
      id: '2',
      type: 'Routine Checkup',
      date: new Date('2024-10-20'),
      time: '2:30 PM',
      location: 'Downtown Lab',
      doctor: 'Dr. Johnson',
      status: 'completed',
      tests: ['Basic Metabolic Panel'],
    },
  ];

  const filteredAppointments = appointments.filter(apt => 
    activeTab === 'upcoming' ? apt.status === 'upcoming' : apt.status !== 'upcoming'
  );

  return (
    <div className="flex-1 bg-gray-50">
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
                activeTab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'past' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Past
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-4 space-y-3">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
              onClick={() => navigate(`/patient/appointments/${appointment.id}`)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900">{appointment.type}</h3>
                  <span className={`text-sm font-medium ${
                    appointment.status === 'upcoming' ? 'text-green-600' :
                    appointment.status === 'completed' ? 'text-gray-600' :
                    'text-red-600'
                  }`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{format(appointment.date, 'EEEE, MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{appointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{appointment.location}</span>
                  </div>
                </div>

                {appointment.tests.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Tests: {appointment.tests.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {appointment.status === 'upcoming' && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle reschedule
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle cancel
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No {activeTab} appointments</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'upcoming' 
                ? 'Book a new appointment to get started'
                : 'Your past appointments will appear here'
              }
            </p>
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