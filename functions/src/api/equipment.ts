import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { authenticateRequest } from '../middleware/auth';

const projectPrefix = 'labflow_';

// Get all equipment
export const getEquipment = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const equipmentSnapshot = await db.collection(`${projectPrefix}equipment`).get();
      
      const equipment = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(equipment);
    });
  } catch (error) {
    console.error('Error getting equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Sync equipment data
export const syncEquipmentData = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const { equipmentId } = req.params;

      // Update last sync time
      await db.collection(`${projectPrefix}equipment`).doc(equipmentId).update({
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
  } catch (error) {
    console.error('Error syncing equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get equipment logs
export const getEquipmentLogs = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const { equipmentId } = req.params;
      const { days = 7 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const logsSnapshot = await db.collection(`${projectPrefix}equipment_logs`)
        .where('equipmentId', '==', equipmentId)
        .where('timestamp', '>=', startDate)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const logs = logsSnapshot.docs.map(doc => doc.data());

      res.json(logs);
    });
  } catch (error) {
    console.error('Error getting equipment logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Process equipment data
export const processEquipmentData = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const { equipmentId, timestamp, results } = req.body;

      // Validate and process the data
      const processedResults = results.map((result: any) => ({
        ...result,
        processedAt: new Date(),
        status: 'processed'
      }));

      // Store in database
      const batch = db.batch();
      
      processedResults.forEach((result: any) => {
        const docRef = db.collection(`${projectPrefix}equipment_results`).doc();
        batch.set(docRef, {
          equipmentId,
          timestamp,
          ...result
        });
      });

      await batch.commit();

      // Log the activity
      await db.collection(`${projectPrefix}equipment_logs`).add({
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
  } catch (error) {
    console.error('Error processing equipment data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};