import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/types/appointment.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AppointmentCalendarProps {
  onDateSelect?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onNewAppointment?: (date: Date) => void;
  locationId?: string;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onDateSelect,
  onAppointmentClick,
  onNewAppointment,
  locationId,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get appointments for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { data: appointments = [] } = useAppointments({
    locationId,
    dateFrom: monthStart,
    dateTo: monthEnd,
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach(apt => {
      const dateKey = format(apt.scheduledDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [appointments]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getAppointmentStatus = (status: Appointment['status']) => {
    const statusConfig = {
      scheduled: { color: 'blue', label: 'Scheduled' },
      confirmed: { color: 'green', label: 'Confirmed' },
      'in-progress': { color: 'yellow', label: 'In Progress' },
      completed: { color: 'gray', label: 'Completed' },
      cancelled: { color: 'red', label: 'Cancelled' },
      'no-show': { color: 'orange', label: 'No Show' },
    };
    return statusConfig[status] || { color: 'gray', label: status };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointmentsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                  ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 dark:border-gray-700'}
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  hover:border-gray-300 dark:hover:border-gray-600
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                    ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && dayAppointments.length > 0 && (
                    <Badge variant="info" size="sm">
                      {dayAppointments.length}
                    </Badge>
                  )}
                </div>

                {/* Appointment Preview */}
                {isCurrentMonth && dayAppointments.length > 0 && (
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt, i) => {
                      const status = getAppointmentStatus(apt.status);
                      return (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(apt);
                          }}
                          className={`
                            text-xs p-1 rounded truncate cursor-pointer
                            bg-${status.color}-100 text-${status.color}-800
                            dark:bg-${status.color}-900/20 dark:text-${status.color}-400
                            hover:bg-${status.color}-200 dark:hover:bg-${status.color}-900/40
                          `}
                        >
                          {apt.scheduledTime} - {apt.patientName}
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                )}

                {/* Add Appointment Button */}
                {isCurrentMonth && isSameDay(day, selectedDate || new Date()) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewAppointment?.(day);
                    }}
                    className="mt-1 w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Appointments */}
      {selectedDate && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Appointments for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {appointmentsByDate[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
            <div className="space-y-2">
              {appointmentsByDate[format(selectedDate, 'yyyy-MM-dd')].map((apt) => {
                const status = getAppointmentStatus(apt.status);
                return (
                  <div
                    key={apt.id}
                    onClick={() => onAppointmentClick?.(apt)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {apt.scheduledTime} - {apt.patientName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {apt.testNames.join(', ')}
                        </div>
                      </div>
                      <Badge variant={status.color as any} size="sm">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No appointments scheduled for this date.
            </p>
          )}
        </div>
      )}
    </div>
  );
};