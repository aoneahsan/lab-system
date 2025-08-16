import React, { useState } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  PhoneIcon, 
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
  EllipsisVerticalIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Appointment, AppointmentSearchFilters } from '@/types/appointment.types';
import { useAppointments, useCancelAppointment, useCheckInPatient, useCompleteAppointment } from '@/hooks/useAppointments';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { modalService } from '@/services/modalService';

interface AppointmentListProps {
  onAppointmentClick?: (appointment: Appointment) => void;
  filters?: AppointmentSearchFilters;
  showActions?: boolean;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  onAppointmentClick,
  filters: initialFilters = {},
  showActions = true,
}) => {
  const [filters, setFilters] = useState<AppointmentSearchFilters>(initialFilters);
  const { data: appointments = [], isLoading } = useAppointments(filters);
  const cancelAppointment = useCancelAppointment();
  const checkInPatient = useCheckInPatient();
  const completeAppointment = useCompleteAppointment();

  const getStatusBadge = (status: Appointment['status']) => {
    const statusConfig = {
      scheduled: { variant: 'info' as const, label: 'Scheduled' },
      confirmed: { variant: 'success' as const, label: 'Confirmed' },
      'in-progress': { variant: 'warning' as const, label: 'In Progress' },
      completed: { variant: 'default' as const, label: 'Completed' },
      cancelled: { variant: 'danger' as const, label: 'Cancelled' },
      'no-show': { variant: 'warning' as const, label: 'No Show' },
    };
    const config = statusConfig[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getAppointmentTypeIcon = (type: Appointment['appointmentType']) => {
    switch (type) {
      case 'home-collection':
        return <HomeIcon className="h-4 w-4" />;
      case 'walk-in':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const handleCheckIn = async (appointment: Appointment) => {
    await checkInPatient.mutateAsync(appointment.id);
  };

  const handleComplete = async (appointment: Appointment) => {
    await completeAppointment.mutateAsync(appointment.id);
  };

  const handleCancel = async (appointment: Appointment) => {
    const reason = await modalService.prompt({
      title: 'Cancel Appointment',
      message: 'Cancellation reason:',
      placeholder: 'Enter reason for cancellation...',
      required: true
    });
    if (reason !== null) {
      await cancelAppointment.mutateAsync({ id: appointment.id, reason });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search patient name..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          
          <Select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </Select>

          <Select
            value={filters.appointmentType || ''}
            onChange={(e) => setFilters({ ...filters, appointmentType: e.target.value as any })}
          >
            <option value="">All Types</option>
            <option value="scheduled">Scheduled</option>
            <option value="walk-in">Walk-in</option>
            <option value="home-collection">Home Collection</option>
          </Select>

          <Select
            value={filters.locationId || ''}
            onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
          >
            <option value="">All Locations</option>
            <option value="main-lab">Main Laboratory</option>
            <option value="branch-1">Downtown Branch</option>
            <option value="branch-2">North Side Branch</option>
          </Select>
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-8">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No appointments found.
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {getAppointmentTypeIcon(appointment.appointmentType)}
                      <h3 
                        className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => onAppointmentClick?.(appointment)}
                      >
                        {appointment.patientName}
                      </h3>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {format(appointment.scheduledDate, 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {appointment.scheduledTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <PhoneIcon className="h-4 w-4" />
                      {appointment.patientPhone}
                    </div>
                  </div>

                  {appointment.appointmentType === 'home-collection' && appointment.homeCollection && (
                    <div className="mt-2 flex items-start gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4 mt-0.5" />
                      <span className="truncate">{appointment.homeCollection.address}</span>
                    </div>
                  )}

                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Tests: {appointment.testNames.join(', ')}
                  </div>
                </div>

                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {appointment.status === 'scheduled' && (
                        <>
                          <DropdownMenuItem onClick={() => handleCheckIn(appointment)}>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Check In
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancel(appointment)}>
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                      {appointment.status === 'in-progress' && (
                        <DropdownMenuItem onClick={() => handleComplete(appointment)}>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onAppointmentClick?.(appointment)}>
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};