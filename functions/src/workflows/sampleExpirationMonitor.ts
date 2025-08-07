import * as admin from 'firebase-admin';
import { notificationService } from '../services/notificationService';

interface Sample {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  sampleType: string;
  collectionDate: admin.firestore.Timestamp;
  expirationDate: admin.firestore.Timestamp;
  status: string;
  testOrderId: string;
  alertSent?: boolean;
}

export const sampleExpirationMonitor = async () => {
  console.log('Starting sample expiration monitor...');
  
  try {
    const tenantsSnapshot = await admin.firestore()
      .collection('tenants')
      .where('isActive', '==', true)
      .get();
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      
      console.log(`Checking samples for tenant: ${tenantData.name}`);
      
      // Check expiring samples (within 24 hours)
      await checkExpiringSamples(tenantId);
      
      // Check expired samples
      await checkExpiredSamples(tenantId);
    }
    
    console.log('Sample expiration monitor completed');
    
  } catch (error) {
    console.error('Error in sample expiration monitor:', error);
    throw error;
  }
};

async function checkExpiringSamples(tenantId: string) {
  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const expiringSamples = await admin.firestore()
    .collection(`labflow_${tenantId}_samples`)
    .where('status', 'in', ['collected', 'in_transit', 'received'])
    .where('expirationDate', '>', now)
    .where('expirationDate', '<=', twentyFourHoursLater)
    .where('expiringAlertSent', '==', false)
    .get();
  
  console.log(`Found ${expiringSamples.size} expiring samples for tenant ${tenantId}`);
  
  for (const doc of expiringSamples.docs) {
    const sample = { id: doc.id, ...doc.data() } as Sample;
    
    await notifyExpiringSample(tenantId, sample);
    
    await doc.ref.update({
      expiringAlertSent: true,
      alertSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function checkExpiredSamples(tenantId: string) {
  const now = new Date();
  
  const expiredSamples = await admin.firestore()
    .collection(`labflow_${tenantId}_samples`)
    .where('status', 'in', ['collected', 'in_transit', 'received'])
    .where('expirationDate', '<=', now)
    .where('expiredAlertSent', '==', false)
    .get();
  
  console.log(`Found ${expiredSamples.size} expired samples for tenant ${tenantId}`);
  
  for (const doc of expiredSamples.docs) {
    const sample = { id: doc.id, ...doc.data() } as Sample;
    
    // Update sample status to expired
    await doc.ref.update({
      status: 'expired',
      expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      expiredAlertSent: true
    });
    
    await notifyExpiredSample(tenantId, sample);
    
    // Create audit log
    await admin.firestore()
      .collection(`labflow_${tenantId}_audit_logs`)
      .add({
        resourceType: 'sample',
        resourceId: sample.id,
        action: 'sample_expired',
        details: {
          sampleType: sample.sampleType,
          collectionDate: sample.collectionDate,
          expirationDate: sample.expirationDate
        },
        performedBy: 'system',
        performedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  }
}

async function notifyExpiringSample(tenantId: string, sample: Sample) {
  const hoursUntilExpiry = Math.ceil(
    (sample.expirationDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60)
  );
  
  const message = `Sample expiring soon: ${sample.sampleType} for patient ${sample.patientName} expires in ${hoursUntilExpiry} hours. Sample ID: ${sample.id}`;
  
  await notifyLabStaff(tenantId, {
    type: 'sample_expiring',
    message,
    sample
  });
}

async function notifyExpiredSample(tenantId: string, sample: Sample) {
  const message = `Sample expired: ${sample.sampleType} for patient ${sample.patientName} has expired. Sample ID: ${sample.id}. Please collect a new sample.`;
  
  await notifyLabStaff(tenantId, {
    type: 'sample_expired',
    message,
    sample
  });
}

async function notifyLabStaff(tenantId: string, notification: any) {
  const labStaff = await admin.firestore()
    .collection('labflow_users')
    .where('tenantId', '==', tenantId)
    .where('roles', 'array-contains-any', ['lab_technician', 'lab_manager'])
    .where('notificationsEnabled', '==', true)
    .get();
  
  const notifications = [];
  
  for (const staffDoc of labStaff.docs) {
    const staff = staffDoc.data();
    
    // In-app notification
    notifications.push(
      admin.firestore()
        .collection(`labflow_${tenantId}_notifications`)
        .add({
          userId: staffDoc.id,
          type: 'sample_alert',
          title: notification.type === 'sample_expiring' ? 'Sample Expiring Soon' : 'Sample Expired',
          message: notification.message,
          data: notification,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    );
    
    // Email notification for expired samples
    if (staff.email && staff.emailNotifications && notification.type === 'sample_expired') {
      notifications.push(
        notificationService.sendEmail(
          staff.email,
          'Sample Expired Alert - LabFlow',
          `
          <h3>Sample Expired</h3>
          <p>${notification.message}</p>
          <p>Please arrange for a new sample collection immediately.</p>
          `
        )
      );
    }
  }
  
  await Promise.all(notifications);
}