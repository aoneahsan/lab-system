import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentReminderService } from '@/services/appointment-reminder.service';
import { toast } from '@/stores/toast.store';

export const useAppointmentTemplates = () => {
  return useQuery({
    queryKey: ['appointment-templates'],
    queryFn: () => appointmentReminderService.getAppointmentTemplates(),
  });
};

export const useSendAppointmentReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      appointmentId, 
      channel, 
      templateId 
    }: { 
      appointmentId: string; 
      channel: 'sms' | 'whatsapp' | 'email'; 
      templateId: string;
    }) => appointmentReminderService.sendReminder(appointmentId, channel, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Success', `${variables.channel} reminder sent successfully`);
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to send reminder');
    },
  });
};

export const useSendBulkReminders = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      hoursInAdvance, 
      channel, 
      templateId 
    }: { 
      hoursInAdvance: number; 
      channel: 'sms' | 'whatsapp' | 'email'; 
      templateId: string;
    }) => appointmentReminderService.sendBulkReminders(hoursInAdvance, channel, templateId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(
        'Bulk Reminders Sent', 
        `Sent: ${result.sent}, Failed: ${result.failed}`
      );
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to send bulk reminders');
    },
  });
};

export const useAppointmentRemindersStatus = (appointmentId: string) => {
  return useQuery({
    queryKey: ['appointment-reminders-status', appointmentId],
    queryFn: () => appointmentReminderService.getRemindersStatus(appointmentId),
    enabled: !!appointmentId,
  });
};

export const useScheduleAutomatedReminders = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId: string) => 
      appointmentReminderService.scheduleAutomatedReminders(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-reminders'] });
      toast.success('Success', 'Automated reminders scheduled');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to schedule reminders');
    },
  });
};

export const useAppointmentCommPreferences = (patientId: string) => {
  return useQuery({
    queryKey: ['appointment-comm-preferences', patientId],
    queryFn: () => appointmentReminderService.getAppointmentCommPreferences(patientId),
    enabled: !!patientId,
  });
};