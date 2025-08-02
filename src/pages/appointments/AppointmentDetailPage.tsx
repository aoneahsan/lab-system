import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppointment } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const AppointmentDetailPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { data: appointment, isLoading } = useAppointment(appointmentId || '');

  if (isLoading) return <div>Loading...</div>;
  if (!appointment) return <div>Appointment not found</div>;

  return (
    <div className="p-6">
      <Button variant="secondary" onClick={() => navigate('/appointments')}>
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-2xl font-semibold mt-4">{appointment.patientName}</h1>
      <p>Status: {appointment.status}</p>
    </div>
  );
};

export default AppointmentDetailPage;