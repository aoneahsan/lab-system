import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, ChevronRight, X, Check } from 'lucide-react';
import { unifiedNotificationService } from '@/services/unified-notification.service';
import { toast } from '@/hooks/useToast';

interface Appointment {
  id: string;
  date: Date;
  time: string;
  location: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  doctor?: string;
  tests?: string[];
}

const MobileAppointmentsPage: React.FC = () => {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Mock appointments data
  const appointments: Appointment[] = [
    {
      id: '1',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '10:00 AM',
      location: 'LabFlow Main Center',
      type: 'Blood Test',
      status: 'upcoming',
      doctor: 'Dr. Smith',
      tests: ['Complete Blood Count', 'Lipid Panel'],
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000 * 7), // Last week
      time: '2:30 PM',
      location: 'LabFlow Downtown',
      type: 'Routine Checkup',
      status: 'completed',
      tests: ['Basic Metabolic Panel'],
    },
  ];

  const availableTimes = [
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
    '4:00 PM',
    '4:30 PM',
  ];

  const commonTests = [
    { id: 'cbc', name: 'Complete Blood Count (CBC)' },
    { id: 'lipid', name: 'Lipid Panel' },
    { id: 'glucose', name: 'Glucose Test' },
    { id: 'thyroid', name: 'Thyroid Function Test' },
    { id: 'liver', name: 'Liver Function Test' },
    { id: 'kidney', name: 'Kidney Function Test' },
  ];

  const scheduleReminder = async (appointment: Appointment) => {
    try {
      const permissions = await unifiedNotificationService.checkNotificationPermissions();
      
      if (!permissions.local) {
        const granted = await unifiedNotificationService.requestPushPermission();
        if (!granted) {
          toast.warning('Notification permission denied');
          return;
        }
      }

      // Schedule reminder 1 hour before appointment
      const notificationId = await unifiedNotificationService.scheduleAppointmentReminder(
        appointment.id,
        'Patient', // In real app, would use actual patient name
        appointment.date,
        60 // 60 minutes before
      );

      toast.success('Reminder scheduled');
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      toast.error('Failed to schedule reminder');
    }
  };

  const bookAppointment = async () => {
    if (!selectedDate || !selectedTime || selectedTests.length === 0) {
      toast.error('Please complete all fields');
      return;
    }

    try {
      // In real app, would make API call
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        date: selectedDate,
        time: selectedTime,
        location: 'LabFlow Main Center',
        type: 'Lab Tests',
        status: 'upcoming',
        tests: selectedTests.map((id) => commonTests.find((t) => t.id === id)?.name || ''),
      };

      await scheduleReminder(newAppointment);

      toast.success('Appointment booked successfully');
      setShowBooking(false);
      setSelectedDate(null);
      setSelectedTime('');
      setSelectedTests([]);
    } catch (error) {
      toast.error('Failed to book appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <button
            onClick={() => setShowBooking(true)}
            className="p-2 bg-blue-600 text-white rounded-lg"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 px-6 py-4">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments scheduled</p>
            <button
              onClick={() => setShowBooking(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{appointment.type}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{appointment.date.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{appointment.location}</span>
                  </div>
                </div>

                {appointment.tests && appointment.tests.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-1">Tests:</p>
                    <div className="flex flex-wrap gap-1">
                      {appointment.tests.map((test, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.status === 'upcoming' && (
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      Reschedule
                    </button>
                    <button className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Book Appointment</h2>
                <button onClick={() => setShowBooking(false)} className="p-2 text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Selection */}
              {selectedTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tests
                  </label>
                  <div className="space-y-2">
                    {commonTests.map((test) => (
                      <label key={test.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          value={test.id}
                          checked={selectedTests.includes(test.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTests([...selectedTests, test.id]);
                            } else {
                              setSelectedTests(selectedTests.filter((t) => t !== test.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">{test.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={bookAppointment}
                disabled={!selectedDate || !selectedTime || selectedTests.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAppointmentsPage;
