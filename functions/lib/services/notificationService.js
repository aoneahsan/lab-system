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
exports.notificationService = void 0;
const admin = __importStar(require("firebase-admin"));
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
exports.notificationService = {
    async sendCriticalResultAlert(resultId, result) {
        console.log(`Sending critical result alert for ${resultId}`);
        // Implementation handled in criticalResultsMonitor
    },
    async sendSampleStatusUpdate(sampleId, oldStatus, newStatus) {
        console.log(`Sample ${sampleId} status changed from ${oldStatus} to ${newStatus}`);
        // Get sample details
        const sample = await admin.firestore()
            .collection('labflow_samples')
            .doc(sampleId)
            .get();
        if (!sample.exists)
            return;
        const sampleData = sample.data();
        // Notify relevant parties based on status change
        if (newStatus === 'completed') {
            // Notify physician and patient
            await this.createNotification({
                type: 'sample_completed',
                title: 'Sample Processing Complete',
                body: `Sample ${sampleData?.sampleNumber} has been processed and results are available.`,
                userId: sampleData?.physicianId,
                data: { sampleId, status: newStatus }
            });
        }
    },
    async sendPushNotification(token, message, data) {
        try {
            const response = await admin.messaging().send({
                token,
                notification: message,
                data: data ? this.stringifyData(data) : undefined,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            });
            console.log('Push notification sent:', response);
            return { success: true, messageId: response };
        }
        catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    },
    async sendSms(phoneNumber, message) {
        return smsService_1.smsService.send(phoneNumber, message);
    },
    async sendEmail(to, subject, html) {
        return emailService_1.emailService.send(to, subject, html);
    },
    async escalateCriticalResult(resultId, result) {
        console.log(`Escalating critical result ${resultId}`);
        // Get escalation contacts
        const escalationContacts = await admin.firestore()
            .collection('labflow_settings')
            .doc('escalation_contacts')
            .get();
        if (!escalationContacts.exists) {
            console.error('No escalation contacts configured');
            return;
        }
        const contacts = escalationContacts.data()?.contacts || [];
        for (const contact of contacts) {
            if (contact.phoneNumber) {
                await this.sendSms(contact.phoneNumber, `ESCALATION: Unacknowledged critical result for ${result.patientName}. Result ID: ${resultId}. Please review immediately.`);
            }
            if (contact.email) {
                await this.sendEmail(contact.email, 'ESCALATION: Unacknowledged Critical Result', `
          <h2>Escalation Alert</h2>
          <p>An unacknowledged critical result requires immediate attention.</p>
          <p><strong>Result ID:</strong> ${resultId}</p>
          <p><strong>Patient:</strong> ${result.patientName}</p>
          <p><strong>Test:</strong> ${result.testName}</p>
          <p><strong>Value:</strong> ${result.value} ${result.unit}</p>
          <p>Please log in to the system immediately to review and acknowledge this result.</p>
          `);
            }
        }
    },
    async createNotification(notification) {
        await admin.firestore().collection('labflow_notifications').add({
            ...notification,
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    },
    stringifyData(data) {
        const stringified = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                stringified[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
            }
        }
        return stringified;
    }
};
//# sourceMappingURL=notificationService.js.map