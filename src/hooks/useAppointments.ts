import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { useTenant } from '@/hooks/useTenant';
import { Appointment, AppointmentFormData } from '@/types/appointment.types';
import { toast } from '@/stores/toast.store';

export const useAppointments = (filters?: any) => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['appointments', currentTenant?.id, filters],
    queryFn: () => appointmentService.getAppointments(currentTenant?.id || '', filters),
    enabled: !!currentTenant?.id,
  });
};

export const useAppointment = (appointmentId: string) => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['appointment', currentTenant?.id, appointmentId],
    queryFn: () => appointmentService.getAppointment(currentTenant?.id || '', appointmentId),
    enabled: !!currentTenant?.id && !!appointmentId,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: (data: Partial<Appointment>) => 
      appointmentService.createAppointment(currentTenant?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', currentTenant?.id] });
      toast.success('Appointment Created', 'The appointment has been scheduled successfully.');
    },
    onError: (error) => {
      toast.error('Error', 'Failed to create appointment. Please try again.');
      console.error('Error creating appointment:', error);
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Appointment> }) =>
      appointmentService.updateAppointment(currentTenant?.id || '', id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', currentTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['appointment', currentTenant?.id, variables.id] });
      toast.success('Appointment Updated', 'The appointment has been updated successfully.');
    },
    onError: (error) => {
      toast.error('Error', 'Failed to update appointment. Please try again.');
      console.error('Error updating appointment:', error);
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentService.cancelAppointment(currentTenant?.id || '', id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', currentTenant?.id] });
      toast.success('Appointment Cancelled', 'The appointment has been cancelled.');
    },
    onError: (error) => {
      toast.error('Error', 'Failed to cancel appointment. Please try again.');
      console.error('Error cancelling appointment:', error);
    },
  });
};

export const useCheckInPatient = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: (appointmentId: string) =>
      appointmentService.checkInPatient(currentTenant?.id || '', appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', currentTenant?.id] });
      toast.success('Patient Checked In', 'The patient has been checked in successfully.');
    },
    onError: (error) => {
      toast.error('Error', 'Failed to check in patient. Please try again.');
      console.error('Error checking in patient:', error);
    },
  });
};

export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: (appointmentId: string) =>
      appointmentService.completeAppointment(currentTenant?.id || '', appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', currentTenant?.id] });
      toast.success('Appointment Completed', 'The appointment has been marked as completed.');
    },
    onError: (error) => {
      toast.error('Error', 'Failed to complete appointment. Please try again.');
      console.error('Error completing appointment:', error);
    },
  });
};

export const useAvailableSlots = (locationId: string, date: Date, type?: 'regular' | 'home-collection') => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['appointment-slots', currentTenant?.id, locationId, date.toISOString(), type],
    queryFn: () => appointmentService.getAvailableSlots(currentTenant?.id || '', locationId, date, type),
    enabled: !!currentTenant?.id && !!locationId,
  });
};

export const useAppointmentSettings = () => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['appointment-settings', currentTenant?.id],
    queryFn: () => appointmentService.getAppointmentSettings(currentTenant?.id || ''),
    enabled: !!currentTenant?.id,
  });
};

export const useUpdateAppointmentSettings = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: (settings: any) =>
      appointmentService.updateAppointmentSettings(currentTenant?.id || '', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-settings', currentTenant?.id] });
      toast.success('Settings Updated', 'Appointment settings have been updated successfully.');
    },
    onError: (error) => {
      toast.error('Error', 'Failed to update settings. Please try again.');
      console.error('Error updating appointment settings:', error);
    },
  });
};