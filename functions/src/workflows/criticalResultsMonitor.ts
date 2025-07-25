import * as admin from 'firebase-admin';
import { notificationService } from '../services/notificationService';

export const criticalResultsMonitor = async () => {
  console.log('Starting critical results monitor...');
  
  try {
    // Get all unnotified critical results
    const criticalResults = await admin.firestore()
      .collection('labflow_results')
      .where('isCritical', '==', true)
      .where('notificationStatus', '==', 'pending')
      .where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .get();
    
    console.log(`Found ${criticalResults.size} pending critical results`);
    
    for (const doc of criticalResults.docs) {
      const result = doc.data();
      const resultId = doc.id;
      
      try {
        // Get patient and physician information
        const patient = await admin.firestore()
          .collection('labflow_patients')
          .doc(result.patientId)
          .get();
        
        const physician = result.physicianId ? await admin.firestore()
          .collection('labflow_users')
          .doc(result.physicianId)
          .get() : null;
        
        if (!patient.exists) {
          console.error(`Patient not found for result ${resultId}`);
          continue;
        }
        
        // Send notifications
        const notifications = [];
        
        // Notify physician if available
        if (physician?.exists) {
          const physicianData = physician.data();
          
          // SMS notification
          if (physicianData?.phoneNumber) {
            notifications.push(
              notificationService.sendSms(physicianData.phoneNumber, 
                `CRITICAL RESULT: ${patient.data()?.name} - ${result.testName}: ${result.value} ${result.unit}. Please review immediately.`
              )
            );
          }
          
          // Email notification
          if (physicianData?.email) {
            notifications.push(
              notificationService.sendEmail(
                physicianData.email,
                'Critical Laboratory Result - Immediate Attention Required',
                `
                <h2>Critical Laboratory Result</h2>
                <p><strong>Patient:</strong> ${patient.data()?.name}</p>
                <p><strong>Test:</strong> ${result.testName}</p>
                <p><strong>Result:</strong> ${result.value} ${result.unit}</p>
                <p><strong>Reference Range:</strong> ${result.referenceRange}</p>
                <p><strong>Date:</strong> ${new Date(result.createdAt.seconds * 1000).toLocaleString()}</p>
                <p>Please log in to the LabFlow system to review this result immediately.</p>
                `
              )
            );
          }
          
          // Push notification
          if (physicianData?.fcmToken) {
            notifications.push(
              notificationService.sendPushNotification(
                physicianData.fcmToken,
                {
                  title: 'Critical Laboratory Result',
                  body: `${patient.data()?.name} - ${result.testName}: ${result.value} ${result.unit}`
                },
                {
                  resultId,
                  patientId: result.patientId,
                  type: 'critical_result'
                }
              )
            );
          }
        }
        
        // Wait for all notifications to complete
        await Promise.all(notifications);
        
        // Update notification status
        await doc.ref.update({
          notificationStatus: 'notified',
          notificationAttempts: admin.firestore.FieldValue.increment(1),
          lastNotificationAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create notification record
        await admin.firestore().collection('labflow_critical_notifications').add({
          resultId,
          patientId: result.patientId,
          physicianId: result.physicianId,
          notificationType: 'automated',
          notificationMethods: ['sms', 'email', 'push'],
          status: 'sent',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Successfully notified for critical result ${resultId}`);
        
      } catch (error) {
        console.error(`Error processing critical result ${resultId}:`, error);
        
        // Update error status
        await doc.ref.update({
          notificationError: error instanceof Error ? error.message : 'Unknown error',
          notificationAttempts: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    // Check for escalation needed (results not acknowledged within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const unacknowledgedResults = await admin.firestore()
      .collection('labflow_results')
      .where('isCritical', '==', true)
      .where('notificationStatus', '==', 'notified')
      .where('acknowledgedAt', '==', null)
      .where('lastNotificationAt', '<=', thirtyMinutesAgo)
      .get();
    
    console.log(`Found ${unacknowledgedResults.size} unacknowledged critical results needing escalation`);
    
    for (const doc of unacknowledgedResults.docs) {
      const result = doc.data();
      
      // Escalate to supervisor or on-call physician
      await notificationService.escalateCriticalResult(doc.id, result);
      
      await doc.ref.update({
        notificationStatus: 'escalated',
        escalatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log('Critical results monitor completed');
    
  } catch (error) {
    console.error('Error in critical results monitor:', error);
    throw error;
  }
};