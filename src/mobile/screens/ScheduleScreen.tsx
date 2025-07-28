import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

const ScheduleScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const appointments = [
    {
      id: '1',
      time: '09:00 AM',
      patientName: 'John Doe',
      address: '123 Main St, Apt 4B',
      tests: ['CBC', 'Lipid Panel'],
      status: 'pending',
    },
    {
      id: '2',
      time: '10:30 AM',
      patientName: 'Jane Smith',
      address: '456 Oak Ave',
      tests: ['Glucose', 'HbA1c'],
      status: 'completed',
    },
    {
      id: '3',
      time: '02:00 PM',
      patientName: 'Robert Johnson',
      address: '789 Pine Rd',
      tests: ['TSH', 'T3', 'T4'],
      status: 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Today's Schedule ({appointments.length} appointments)
        </h2>

        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className={`bg-white rounded-lg shadow p-4 ${
              appointment.status === 'completed' ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">{appointment.time}</span>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  appointment.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {appointment.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{appointment.patientName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{appointment.address}</p>
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Tests:</p>
                <div className="flex flex-wrap gap-1">
                  {appointment.tests.map((test, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {appointment.status === 'pending' && (
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
                  Start Collection
                </button>
                <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                  Navigate
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleScreen;
