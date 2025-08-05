"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldData = exports.processUploadedDocument = exports.sendNotification = exports.generatePdfReport = exports.syncData = exports.onOrderCreated = exports.onSampleStatusUpdated = exports.onResultCreated = exports.processBillingAutomation = exports.verifyInsuranceEligibility = exports.monitorQualityControl = exports.monitorInventory = exports.generateScheduledReports = exports.sendAppointmentReminders = exports.checkSampleExpiration = exports.monitorCriticalResults = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Import function modules
const criticalResultsMonitor_1 = require("./workflows/criticalResultsMonitor");
const sampleExpirationChecker_1 = require("./workflows/sampleExpirationChecker");
const appointmentReminders_1 = require("./workflows/appointmentReminders");
const reportGenerator_1 = require("./workflows/reportGenerator");
const inventoryAlerts_1 = require("./workflows/inventoryAlerts");
const qualityControlMonitor_1 = require("./workflows/qualityControlMonitor");
const insuranceEligibilityChecker_1 = require("./workflows/insuranceEligibilityChecker");
const billingAutomation_1 = require("./workflows/billingAutomation");
const dataSync_1 = require("./sync/dataSync");
const notificationService_1 = require("./services/notificationService");
const emailService_1 = require("./services/emailService");
const smsService_1 = require("./services/smsService");
const pdfGeneratorService_1 = require("./services/pdfGeneratorService");
// Initialize Admin SDK
admin.initializeApp();
// Automated Workflows
// Monitor critical results and send notifications
exports.monitorCriticalResults = functions
    .runWith({ memory: '512MB', timeoutSeconds: 300 })
    .pubsub.schedule('every 5 minutes')
    .onRun(criticalResultsMonitor_1.criticalResultsMonitor);
// Check for expiring samples
exports.checkSampleExpiration = functions
    .runWith({ memory: '256MB', timeoutSeconds: 120 })
    .pubsub.schedule('every day 06:00')
    .onRun(sampleExpirationChecker_1.sampleExpirationChecker);
// Send appointment reminders
exports.sendAppointmentReminders = functions
    .runWith({ memory: '512MB', timeoutSeconds: 300 })
    .pubsub.schedule('every hour')
    .onRun(appointmentReminders_1.appointmentReminders);
// Generate scheduled reports
exports.generateScheduledReports = functions
    .runWith({ memory: '1GB', timeoutSeconds: 540 })
    .pubsub.schedule('0 1 * * *') // Daily at 1 AM
    .onRun(reportGenerator_1.reportGenerator);
// Monitor inventory levels
exports.monitorInventory = functions
    .runWith({ memory: '256MB', timeoutSeconds: 120 })
    .pubsub.schedule('every 6 hours')
    .onRun(inventoryAlerts_1.inventoryAlerts);
// Quality control monitoring
exports.monitorQualityControl = functions
    .runWith({ memory: '512MB', timeoutSeconds: 240 })
    .pubsub.schedule('every 30 minutes')
    .onRun(qualityControlMonitor_1.qualityControlMonitor);
// Verify insurance eligibility
exports.verifyInsuranceEligibility = functions
    .runWith({ memory: '512MB', timeoutSeconds: 300 })
    .pubsub.schedule('every day 05:00')
    .onRun(insuranceEligibilityChecker_1.insuranceEligibilityChecker);
// Automated billing tasks
exports.processBillingAutomation = functions
    .runWith({ memory: '512MB', timeoutSeconds: 300 })
    .pubsub.schedule('every day 02:00')
    .onRun(billingAutomation_1.billingAutomation);
// Real-time Triggers
// New result created - check if critical
exports.onResultCreated = functions.firestore
    .document('labflow_results/{resultId}')
    .onCreate(async (snap, context) => {
    const result = snap.data();
    const resultId = context.params.resultId;
    // Check if result has critical values
    if (result.isCritical) {
        await notificationService_1.notificationService.sendCriticalResultAlert(resultId, result);
    }
});
// Sample status updated
exports.onSampleStatusUpdated = functions.firestore
    .document('labflow_samples/{sampleId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== after.status) {
        // Notify relevant parties about status change
        await notificationService_1.notificationService.sendSampleStatusUpdate(context.params.sampleId, before.status, after.status);
    }
});
// Order created - check inventory
exports.onOrderCreated = functions.firestore
    .document('labflow_orders/{orderId}')
    .onCreate(async (snap, context) => {
    const order = snap.data();
    // Update inventory levels
    for (const item of order.items) {
        await admin.firestore()
            .collection('labflow_inventory')
            .doc(item.productId)
            .update({
            quantity: admin.firestore.FieldValue.increment(-item.quantity),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});
// HTTP Functions
// Sync data endpoint
exports.syncData = functions
    .runWith({ memory: '1GB', timeoutSeconds: 540 })
    .https.onRequest(dataSync_1.dataSync);
// Generate PDF report on demand
exports.generatePdfReport = functions
    .runWith({ memory: '1GB', timeoutSeconds: 300 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    return await pdfGeneratorService_1.pdfGeneratorService.generateReport(data);
});
// Send notification on demand
exports.sendNotification = functions
    .runWith({ memory: '256MB', timeoutSeconds: 60 })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { type, recipient, message, data: notificationData } = data;
    switch (type) {
        case 'email':
            return await emailService_1.emailService.send(recipient, message.subject, message.body);
        case 'sms':
            return await smsService_1.smsService.send(recipient, message.body);
        case 'push':
            return await notificationService_1.notificationService.sendPushNotification(recipient, message, notificationData);
        default:
            throw new functions.https.HttpsError('invalid-argument', 'Invalid notification type');
    }
});
// Storage trigger for document processing
exports.processUploadedDocument = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath)
        return;
    // Process different document types
    if (filePath.startsWith('labflow/reports/')) {
        // Process reports
        console.log('Processing report:', filePath);
    }
    else if (filePath.startsWith('labflow/results/')) {
        // Process result attachments
        console.log('Processing result attachment:', filePath);
    }
});
// Cleanup old data
exports.cleanupOldData = functions
    .runWith({ memory: '512MB', timeoutSeconds: 540 })
    .pubsub.schedule('every sunday 03:00')
    .onRun(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Clean up old notifications
    const oldNotifications = await admin.firestore()
        .collection('labflow_notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .where('status', '==', 'read')
        .get();
    const batch = admin.firestore().batch();
    oldNotifications.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleaned up ${oldNotifications.size} old notifications`);
});
//# sourceMappingURL=index.js.map