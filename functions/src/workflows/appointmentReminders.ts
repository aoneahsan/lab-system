import * as admin from 'firebase-admin';
import { notificationService } from '../services/notificationService';

interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  appointmentType: 'lab_test' | 'sample_collection' | 'consultation' | 'home_collection';
  scheduledDate: admin.firestore.Timestamp;
  scheduledTime: string; // Format: "HH:MM"
  location?: string;
  tests?: string[];
  specialInstructions?: string;
  reminderSent: boolean;
  reminderSentAt?: admin.firestore.Timestamp;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
}

interface ReminderSettings {
  enabled: boolean;
  advanceHours: number; // How many hours before appointment to send reminder
  methods: ('sms' | 'email' | 'push')[];
  includePreparationInstructions: boolean;
}

export const appointmentReminders = async () => {
  console.log('Starting appointment reminders task...');
  
  try {
    // Get all active tenants
    const tenantsSnapshot = await admin.firestore()
      .collection('tenants')
      .where('isActive', '==', true)
      .get();
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      
      // Get tenant's reminder settings
      const reminderSettings = await getReminderSettings(tenantId);
      
      if (!reminderSettings.enabled) {
        console.log(`Reminders disabled for tenant: ${tenantData.name}`);
        continue;
      }
      
      console.log(`Processing appointment reminders for tenant: ${tenantData.name}`);
      
      // Send reminders for upcoming appointments
      await sendUpcomingAppointmentReminders(tenantId, reminderSettings);
      
      // Send day-before reminders
      await sendDayBeforeReminders(tenantId);
      
      // Send same-day morning reminders
      await sendSameDayReminders(tenantId);
    }
    
    console.log('Appointment reminders task completed');
    
  } catch (error) {
    console.error('Error in appointment reminders task:', error);
    throw error;
  }
};

async function getReminderSettings(tenantId: string): Promise<ReminderSettings> {
  const doc = await admin.firestore()
    .collection('tenants')
    .doc(tenantId)
    .collection('settings')
    .doc('appointments')
    .get();
  
  const settings = doc.data()?.reminderSettings;
  
  return {
    enabled: settings?.enabled ?? true,
    advanceHours: settings?.advanceHours ?? 24,
    methods: settings?.methods ?? ['sms', 'email'],
    includePreparationInstructions: settings?.includePreparationInstructions ?? true
  };
}

async function sendUpcomingAppointmentReminders(tenantId: string, settings: ReminderSettings) {
  const now = new Date();
  const reminderTime = new Date(now.getTime() + settings.advanceHours * 60 * 60 * 1000);
  
  // Get appointments scheduled within the reminder window
  const appointmentsSnapshot = await admin.firestore()
    .collection(`labflow_${tenantId}_appointments`)
    .where('status', '==', 'scheduled')
    .where('reminderSent', '==', false)
    .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(now))
    .where('scheduledDate', '<=', admin.firestore.Timestamp.fromDate(reminderTime))
    .get();
  
  console.log(`Found ${appointmentsSnapshot.size} appointments needing reminders for tenant ${tenantId}`);
  
  for (const doc of appointmentsSnapshot.docs) {
    const appointment = { id: doc.id, ...doc.data() } as Appointment;
    
    try {
      await sendAppointmentReminder(appointment, settings, 'standard');
      
      // Mark reminder as sent
      await doc.ref.update({
        reminderSent: true,
        reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Reminder sent for appointment ${appointment.id}`);
      
    } catch (error) {
      console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
    }
  }
}

async function sendDayBeforeReminders(tenantId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  
  const appointmentsSnapshot = await admin.firestore()
    .collection(`labflow_${tenantId}_appointments`)
    .where('status', '==', 'scheduled')
    .where('dayBeforeReminderSent', '==', false)
    .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(tomorrow))
    .where('scheduledDate', '<', admin.firestore.Timestamp.fromDate(dayAfterTomorrow))
    .get();
  
  for (const doc of appointmentsSnapshot.docs) {
    const appointment = { id: doc.id, ...doc.data() } as Appointment;
    
    try {
      await sendAppointmentReminder(appointment, null, 'day_before');
      
      await doc.ref.update({
        dayBeforeReminderSent: true,
        dayBeforeReminderSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error(`Error sending day-before reminder for appointment ${appointment.id}:`, error);
    }
  }
}

async function sendSameDayReminders(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const currentHour = new Date().getHours();
  
  // Only send morning reminders between 7-9 AM
  if (currentHour < 7 || currentHour > 9) {
    return;
  }
  
  const appointmentsSnapshot = await admin.firestore()
    .collection(`labflow_${tenantId}_appointments`)
    .where('status', '==', 'scheduled')
    .where('sameDayReminderSent', '==', false)
    .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(today))
    .where('scheduledDate', '<', admin.firestore.Timestamp.fromDate(tomorrow))
    .get();
  
  for (const doc of appointmentsSnapshot.docs) {
    const appointment = { id: doc.id, ...doc.data() } as Appointment;
    
    try {
      await sendAppointmentReminder(appointment, null, 'same_day');
      
      await doc.ref.update({
        sameDayReminderSent: true,
        sameDayReminderSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error(`Error sending same-day reminder for appointment ${appointment.id}:`, error);
    }
  }
}

async function sendAppointmentReminder(
  appointment: Appointment,
  settings: ReminderSettings | null,
  reminderType: 'standard' | 'day_before' | 'same_day'
) {
  const notifications = [];
  const appointmentDate = appointment.scheduledDate.toDate();
  const formattedDate = appointmentDate.toLocaleDateString();
  const formattedTime = appointment.scheduledTime;
  
  // Get preparation instructions if applicable
  const instructions = await getPreparationInstructions(appointment);
  
  // Prepare message based on reminder type
  let message = '';
  let subject = '';
  
  switch (reminderType) {
    case 'standard':
      subject = 'Appointment Reminder - LabFlow';
      message = `Reminder: You have a ${appointment.appointmentType.replace('_', ' ')} appointment on ${formattedDate} at ${formattedTime}`;
      break;
    case 'day_before':
      subject = 'Tomorrow\'s Appointment - LabFlow';
      message = `Don't forget: Your ${appointment.appointmentType.replace('_', ' ')} appointment is tomorrow (${formattedDate}) at ${formattedTime}`;
      break;
    case 'same_day':
      subject = 'Today\'s Appointment - LabFlow';
      message = `Today's appointment: ${appointment.appointmentType.replace('_', ' ')} at ${formattedTime}`;
      break;
  }
  
  if (appointment.location) {
    message += ` at ${appointment.location}`;
  }
  
  if (instructions && (settings?.includePreparationInstructions ?? true)) {
    message += `\n\nPreparation instructions: ${instructions}`;
  }
  
  // SMS notification
  if (appointment.patientPhone && (!settings || settings.methods.includes('sms'))) {
    notifications.push(
      notificationService.sendSms(appointment.patientPhone, message)
    );
  }
  
  // Email notification
  if (appointment.patientEmail && (!settings || settings.methods.includes('email'))) {
    const emailBody = `
      <h2>${subject}</h2>
      <p>Dear ${appointment.patientName},</p>
      <p>${message}</p>
      ${appointment.tests?.length ? `
        <h3>Scheduled Tests:</h3>
        <ul>
          ${appointment.tests.map(test => `<li>${test}</li>`).join('')}
        </ul>
      ` : ''}
      ${appointment.specialInstructions ? `
        <h3>Special Instructions:</h3>
        <p>${appointment.specialInstructions}</p>
      ` : ''}
      <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
      <p>Thank you,<br>LabFlow Team</p>
    `;
    
    notifications.push(
      notificationService.sendEmail(appointment.patientEmail, subject, emailBody)
    );
  }
  
  // In-app notification
  notifications.push(
    admin.firestore()
      .collection(`labflow_${appointment.tenantId}_notifications`)
      .add({
        userId: appointment.patientId,
        type: 'appointment_reminder',
        title: subject,
        message: message,
        data: {
          appointmentId: appointment.id,
          appointmentDate: appointment.scheduledDate,
          appointmentTime: appointment.scheduledTime,
          reminderType
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
  );
  
  await Promise.all(notifications);
}

async function getPreparationInstructions(appointment: Appointment): Promise<string | null> {
  if (!appointment.tests || appointment.tests.length === 0) {
    return null;
  }
  
  const instructions: string[] = [];
  
  // Common test preparation instructions
  const testInstructions: { [key: string]: string } = {
    'glucose_fasting': 'Fast for 8-12 hours before the test. Water is allowed.',
    'lipid_panel': 'Fast for 9-12 hours before the test. Water is allowed.',
    'cholesterol': 'Fast for 9-12 hours before the test.',
    'urine_culture': 'Collect first morning urine sample in a sterile container.',
    'stool_test': 'Avoid red meat, vitamin C supplements, and certain medications 3 days before.',
    'h_pylori': 'Stop antibiotics and bismuth medications 2 weeks before the test.',
    'thyroid': 'No special preparation needed.',
    'cbc': 'No special preparation needed.',
    'liver_function': 'Fast for 8-12 hours if lipid profile is included.',
  };
  
  for (const test of appointment.tests) {
    const testKey = test.toLowerCase().replace(/\s+/g, '_');
    if (testInstructions[testKey]) {
      instructions.push(`${test}: ${testInstructions[testKey]}`);
    }
  }
  
  return instructions.length > 0 ? instructions.join('\n') : null;
}