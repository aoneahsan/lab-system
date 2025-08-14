import React, { useState, useEffect } from 'react';
import { PlusIcon, CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentBookingForm } from '@/components/appointments/AppointmentBookingForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useNavigate } from 'react-router-dom';
import { useModalState } from '@/hooks/useModalState';
import { useUrlState } from '@/hooks/useUrlState';
import { Appointment } from '@/types/appointment.types';

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const bookingModal = useModalState('booking');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useUrlState('tab', {
    defaultValue: 'calendar',
    removeDefault: true
  });

  // Restore selected date from URL on modal open
  useEffect(() => {
    if (bookingModal.isOpen && bookingModal.modalData.date) {
      setSelectedDate(new Date(bookingModal.modalData.date));
    }
  }, [bookingModal.isOpen, bookingModal.modalData.date]);

  const handleAppointmentClick = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const handleNewAppointment = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      bookingModal.openModal({ date: date.toISOString() });
    } else {
      bookingModal.openModal();
    }
  };

  const handleBookingSuccess = () => {
    bookingModal.closeModal();
    setSelectedDate(null);
    // Appointments will refresh automatically via React Query
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <Button onClick={() => handleNewAppointment()}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ListBulletIcon className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <AppointmentCalendar
            onDateSelect={setSelectedDate}
            onAppointmentClick={handleAppointmentClick}
            onNewAppointment={handleNewAppointment}
          />
        </TabsContent>

        <TabsContent value="list">
          <AppointmentList
            onAppointmentClick={handleAppointmentClick}
            showActions={true}
          />
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal.isOpen}
        onClose={() => {
          bookingModal.closeModal();
          setSelectedDate(null);
        }}
        title="Book New Appointment"
      >
        <AppointmentBookingForm
          onSuccess={handleBookingSuccess}
          onCancel={() => {
            bookingModal.closeModal();
            setSelectedDate(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default AppointmentsPage;