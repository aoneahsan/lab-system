import { 
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useTenantStore } from '@/stores/tenant.store';
// import { FIREBASE_COLLECTIONS } from '@/config/firebase-collections';
import { appointmentService } from './appointment.service';
import { messageService, templateService } from './communication.service';
import type { Appointment } from '@/types/appointment.types';
import type { MessageTemplate } from '@/types/communication.types';
import { logger } from '@/services/logger.service';

const getCollectionName = (collectionName: string) => {
  const tenantPrefix = useTenantStore.getState().currentTenant?.firebasePrefix || 'labflow_';
  return `${tenantPrefix}${collectionName}`;
};

export const appointmentReminderService = {
  // Get appointment reminder templates
  async getAppointmentTemplates(): Promise<MessageTemplate[]> {
    return templateService.getTemplates('appointment');
  },

  // Send appointment reminder
  async sendReminder(
    appointmentId: string,
    channel: 'sms' | 'whatsapp' | 'email',
    templateId: string
  ): Promise<void> {
    // Get appointment details
    const tenantId = useTenantStore.getState().currentTenant?.id;
    if (!tenantId) throw new Error('No tenant ID');
    const appointment = await appointmentService.getAppointment(tenantId, appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    // Prepare template variables
    const variables = {
      patientName: appointment.patientName,
      appointmentDate: new Date(appointment.scheduledDate).toLocaleDateString(),
      appointmentTime: appointment.scheduledTime,
      providerName: 'Doctor',
      location: appointment.locationName,
      duration: `${appointment.duration} minutes`,
      testNames: appointment.testNames.join(', ')
    };

    // Send message based on channel
    const recipientInfo = {
      sms: appointment.patientPhone,
      whatsapp: appointment.patientPhone,
      email: appointment.patientEmail
    };

    if (!recipientInfo[channel]) {
      throw new Error(`Patient does not have ${channel} contact information`);
    }

    // Send the message
    await messageService.sendMessage({
      templateId,
      channel,
      recipientId: appointment.patientId,
      recipientType: 'patient',
      variables
    });

    // Update appointment with reminder sent timestamp
    const appointmentRef = doc(db, getCollectionName('appointments'), appointmentId);
    const reminderUpdate = {
      [`remindersSent.${channel}`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(appointmentRef, reminderUpdate);
  },

  // Send bulk reminders for upcoming appointments
  async sendBulkReminders(
    hoursInAdvance: number,
    channel: 'sms' | 'whatsapp' | 'email',
    templateId: string
  ): Promise<{ sent: number; failed: number }> {
    const tenantId = useTenantStore.getState().currentTenant?.id || '';
    
    // Calculate time range
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursInAdvance * 60 * 60 * 1000);
    const targetStart = new Date(targetTime);
    targetStart.setMinutes(0, 0, 0);
    const targetEnd = new Date(targetTime);
    targetEnd.setMinutes(59, 59, 999);

    // Query appointments in the target time range
    const appointmentsQuery = query(
      collection(db, getCollectionName('appointments')),
      where('tenantId', '==', tenantId),
      where('status', '==', 'scheduled'),
      where('scheduledDate', '>=', Timestamp.fromDate(targetStart)),
      where('scheduledDate', '<=', Timestamp.fromDate(targetEnd))
    );

    const snapshot = await getDocs(appointmentsQuery);
    const appointments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Appointment & { id: string }));

    let sent = 0;
    let failed = 0;

    // Send reminders for each appointment
    for (const appointment of appointments) {
      // Check if reminder already sent for this channel
      if (appointment.remindersSent?.[channel]) {
        continue;
      }

      try {
        await this.sendReminder(appointment.id, channel, templateId);
        sent++;
      } catch (error) {
        logger.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  },

  // Check appointment reminders status
  async getRemindersStatus(appointmentId: string): Promise<{
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  }> {
    const tenantId = useTenantStore.getState().currentTenant?.id;
    if (!tenantId) throw new Error('No tenant ID');
    const appointment = await appointmentService.getAppointment(tenantId, appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    return {
      sms: !!appointment.remindersSent?.sms,
      email: !!appointment.remindersSent?.email,
      whatsapp: !!appointment.remindersSent?.whatsapp
    };
  },

  // Create appointment reminder record
  async createReminderRecord(
    appointmentId: string,
    channel: 'sms' | 'whatsapp' | 'email',
    messageId: string
  ): Promise<string> {
    const remindersCollection = collection(db, getCollectionName('appointment_reminders'));
    const reminderDoc = doc(remindersCollection);
    
    const reminder = {
      id: reminderDoc.id,
      appointmentId,
      type: channel,
      scheduledFor: new Date(),
      status: 'pending' as const,
      attempts: 0,
      metadata: {
        to: '',
        template: '',
        variables: {},
        messageId
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await updateDoc(reminderDoc, reminder);
    return reminderDoc.id;
  },

  // Update reminder status
  async updateReminderStatus(
    reminderId: string,
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    const reminderRef = doc(db, getCollectionName('appointment_reminders'), reminderId);
    const update: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'sent') {
      update.sentAt = serverTimestamp();
    } else if (status === 'failed' && error) {
      update.error = error;
      update.attempts = (await getDoc(reminderRef)).data()?.attempts + 1 || 1;
    }

    await updateDoc(reminderRef, update);
  },

  // Get appointment communication preferences
  async getAppointmentCommPreferences(_patientId: string): Promise<{
    smsEnabled: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    reminderTiming: number[]; // hours before appointment
  }> {
    // This would integrate with the communication preferences service
    // For now, return default preferences
    return {
      smsEnabled: true,
      emailEnabled: true,
      whatsappEnabled: true,
      reminderTiming: [24, 2] // 24 hours and 2 hours before
    };
  },

  // Schedule automated reminders for an appointment
  async scheduleAutomatedReminders(appointmentId: string): Promise<void> {
    const tenantId = useTenantStore.getState().currentTenant?.id;
    if (!tenantId) throw new Error('No tenant ID');
    const appointment = await appointmentService.getAppointment(tenantId, appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const preferences = await this.getAppointmentCommPreferences(appointment.patientId);
    const templates = await this.getAppointmentTemplates();
    
    // Find appropriate reminder template
    const reminderTemplate = templates.find(t => 
      t.triggers?.event === 'appointment_reminder' && t.isActive
    );
    
    if (!reminderTemplate) {
      logger.warn('No active appointment reminder template found');
      return;
    }

    // Schedule reminders based on preferences
    for (const hours of preferences.reminderTiming) {
      const scheduledTime = new Date(appointment.scheduledDate);
      scheduledTime.setHours(scheduledTime.getHours() - hours);

      // Only schedule if in the future
      if (scheduledTime > new Date()) {
        // Create reminder records for enabled channels
        if (preferences.smsEnabled && reminderTemplate.channels.includes('sms')) {
          await this.createReminderRecord(appointmentId, 'sms', '');
        }
        if (preferences.emailEnabled && reminderTemplate.channels.includes('email')) {
          await this.createReminderRecord(appointmentId, 'email', '');
        }
        if (preferences.whatsappEnabled && reminderTemplate.channels.includes('whatsapp')) {
          await this.createReminderRecord(appointmentId, 'whatsapp', '');
        }
      }
    }
  }
};