"use strict";
const __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
const __importStar = (this && this.__importStar) || (function () {
    let ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            const ar = [];
            for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        const result = {};
        if (mod != null) for (let k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.criticalResultsMonitor = void 0;
const admin = __importStar(require("firebase-admin"));
const notificationService_1 = require("../services/notificationService");
const criticalResultsMonitor = async () => {
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
                        notifications.push(notificationService_1.notificationService.sendSms(physicianData.phoneNumber, `CRITICAL RESULT: ${patient.data()?.name} - ${result.testName}: ${result.value} ${result.unit}. Please review immediately.`));
                    }
                    // Email notification
                    if (physicianData?.email) {
                        notifications.push(notificationService_1.notificationService.sendEmail(physicianData.email, 'Critical Laboratory Result - Immediate Attention Required', `
                <h2>Critical Laboratory Result</h2>
                <p><strong>Patient:</strong> ${patient.data()?.name}</p>
                <p><strong>Test:</strong> ${result.testName}</p>
                <p><strong>Result:</strong> ${result.value} ${result.unit}</p>
                <p><strong>Reference Range:</strong> ${result.referenceRange}</p>
                <p><strong>Date:</strong> ${new Date(result.createdAt.seconds * 1000).toLocaleString()}</p>
                <p>Please log in to the LabFlow system to review this result immediately.</p>
                `));
                    }
                    // Push notification
                    if (physicianData?.fcmToken) {
                        notifications.push(notificationService_1.notificationService.sendPushNotification(physicianData.fcmToken, {
                            title: 'Critical Laboratory Result',
                            body: `${patient.data()?.name} - ${result.testName}: ${result.value} ${result.unit}`
                        }, {
                            resultId,
                            patientId: result.patientId,
                            type: 'critical_result'
                        }));
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
            }
            catch (error) {
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
            await notificationService_1.notificationService.escalateCriticalResult(doc.id, result);
            await doc.ref.update({
                notificationStatus: 'escalated',
                escalatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        console.log('Critical results monitor completed');
    }
    catch (error) {
        console.error('Error in critical results monitor:', error);
        throw error;
    }
};
exports.criticalResultsMonitor = criticalResultsMonitor;
//# sourceMappingURL=criticalResultsMonitor.js.map