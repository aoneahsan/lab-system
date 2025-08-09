import { useMutation } from '@tanstack/react-query';
import { messagingService } from '@/services/messaging/messagingService';
import { smsService } from '@/services/messaging/smsService';
import { emailService } from '@/services/messaging/emailService';
import { NotificationPreferences } from '@/config/messaging';

export function useMessaging() {
  // Send templated message
  const sendTemplatedMessage = useMutation({
    mutationFn: messagingService.sendTemplatedMessage.bind(messagingService),
  });

  // Send appointment reminder
  const sendAppointmentReminder = useMutation({
    mutationFn: ({
      patient,
      appointment,
      preferences,
    }: {
      patient: { name: string; email?: string; phone?: string };
      appointment: { date: string; time: string };
      preferences?: NotificationPreferences;
    }) =>
      messagingService.sendAppointmentReminder(patient, appointment, preferences),
  });

  // Send result notification
  const sendResultNotification = useMutation({
    mutationFn: ({
      patient,
      testName,
      isCritical,
      criticalDetails,
      preferences,
    }: {
      patient: { name: string; email?: string; phone?: string };
      testName: string;
      isCritical?: boolean;
      criticalDetails?: { value: string; unit: string; referenceRange: string };
      preferences?: NotificationPreferences;
    }) =>
      messagingService.sendResultNotification(
        patient,
        testName,
        isCritical,
        criticalDetails,
        preferences
      ),
  });

  // Send SMS
  const sendSMS = useMutation({
    mutationFn: smsService.sendSMS.bind(smsService),
  });

  // Send email
  const sendEmail = useMutation({
    mutationFn: emailService.sendEmail.bind(emailService),
  });

  return {
    sendTemplatedMessage,
    sendAppointmentReminder,
    sendResultNotification,
    sendSMS,
    sendEmail,
  };
}

// Hook for notification preferences
export function useNotificationPreferences(_userId: string) {
  // This would typically fetch from the database
  // For now, returning default preferences
  return {
    preferences: {
      email: {
        appointmentReminders: true,
        testResults: true,
        billing: true,
        marketing: false,
      },
      sms: {
        appointmentReminders: true,
        testResults: false,
        criticalAlerts: true,
      },
      push: {
        enabled: true,
        testResults: true,
        appointments: true,
      },
    },
    updatePreferences: async (newPreferences: NotificationPreferences) => {
      // Update preferences in database
      console.log('Updating preferences:', newPreferences);
    },
  };
}