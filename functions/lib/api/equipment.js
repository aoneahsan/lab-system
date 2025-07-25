"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEquipmentData = exports.getEquipmentLogs = exports.syncEquipmentData = exports.getEquipment = void 0;
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const projectPrefix = 'labflow_';
// Get all equipment
const getEquipment = async (req, res) => {
    try {
        await (0, auth_1.authenticateRequest)(req, res, async () => {
            const equipmentSnapshot = await firebase_1.db.collection(`${projectPrefix}equipment`).get();
            const equipment = equipmentSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.json(equipment);
        });
    }
    catch (error) {
        console.error('Error getting equipment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEquipment = getEquipment;
// Sync equipment data
const syncEquipmentData = async (req, res) => {
    try {
        await (0, auth_1.authenticateRequest)(req, res, async () => {
            const { equipmentId } = req.params;
            // Update last sync time
            await firebase_1.db.collection(`${projectPrefix}equipment`).doc(equipmentId).update({
                lastSync: new Date(),
                status: 'online'
            });
            // In a real implementation, this would connect to the equipment
            // and retrieve data via HL7, ASTM, or API
            const syncResult = {
                success: true,
                recordsProcessed: Math.floor(Math.random() * 100),
                errors: 0,
                timestamp: new Date()
            };
            res.json(syncResult);
        });
    }
    catch (error) {
        console.error('Error syncing equipment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.syncEquipmentData = syncEquipmentData;
// Get equipment logs
const getEquipmentLogs = async (req, res) => {
    try {
        await (0, auth_1.authenticateRequest)(req, res, async () => {
            const { equipmentId } = req.params;
            const { days = 7 } = req.query;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - Number(days));
            const logsSnapshot = await firebase_1.db.collection(`${projectPrefix}equipment_logs`)
                .where('equipmentId', '==', equipmentId)
                .where('timestamp', '>=', startDate)
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();
            const logs = logsSnapshot.docs.map(doc => doc.data());
            res.json(logs);
        });
    }
    catch (error) {
        console.error('Error getting equipment logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEquipmentLogs = getEquipmentLogs;
// Process equipment data
const processEquipmentData = async (req, res) => {
    try {
        await (0, auth_1.authenticateRequest)(req, res, async () => {
            const { equipmentId, timestamp, results } = req.body;
            // Validate and process the data
            const processedResults = results.map((result) => ({
                ...result,
                processedAt: new Date(),
                status: 'processed'
            }));
            // Store in database
            const batch = firebase_1.db.batch();
            processedResults.forEach((result) => {
                const docRef = firebase_1.db.collection(`${projectPrefix}equipment_results`).doc();
                batch.set(docRef, {
                    equipmentId,
                    timestamp,
                    ...result
                });
            });
            await batch.commit();
            // Log the activity
            await firebase_1.db.collection(`${projectPrefix}equipment_logs`).add({
                equipmentId,
                timestamp: new Date(),
                action: 'data_processed',
                recordsCount: results.length,
                status: 'success'
            });
            res.json({
                success: true,
                processed: processedResults.length
            });
        });
    }
    catch (error) {
        console.error('Error processing equipment data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.processEquipmentData = processEquipmentData;
//# sourceMappingURL=equipment.js.map