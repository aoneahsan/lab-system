import { Request, Response } from 'express';
import { db, admin } from '../config/firebase';

// Create audit log
export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const auditData = {
      ...req.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    };

    // Get the tenant ID from the authenticated user
    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    const docRef = await db.collection(collectionName).add(auditData);

    res.status(201).json({
      success: true,
      data: { id: docRef.id }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log'
    });
  }
};

// Search audit logs
export const searchAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      success,
      page = 1,
      limit = 20
    } = req.query;

    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    let query = db.collection(collectionName).orderBy('timestamp', 'desc');

    // Apply filters
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (action) {
      query = query.where('action', '==', action);
    }
    if (resource) {
      query = query.where('resource', '==', resource);
    }
    if (success !== undefined) {
      query = query.where('success', '==', success === 'true');
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate as string));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate as string));
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedQuery = query.limit(Number(limit)).offset(offset);

    const snapshot = await paginatedQuery.get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search audit logs'
    });
  }
};

// Get audit log by ID
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    const doc = await db.collection(collectionName).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log'
    });
  }
};

// Get user activity
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const snapshot = await db.collection(collectionName)
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user activity'
    });
  }
};

// Get resource history
export const getResourceHistory = async (req: Request, res: Response) => {
  try {
    const { resource, resourceId } = req.params;
    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    const snapshot = await db.collection(collectionName)
      .where('resource', '==', resource)
      .where('resourceId', '==', resourceId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting resource history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get resource history'
    });
  }
};

// Export audit logs
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { format = 'csv' } = req.query;
    const filters = req.body;

    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    let query = db.collection(collectionName).orderBy('timestamp', 'desc');

    // Apply filters (same as search)
    if (filters.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    if (filters.action) {
      query = query.where('action', '==', filters.action);
    }
    if (filters.resource) {
      query = query.where('resource', '==', filters.resource);
    }
    if (filters.startDate) {
      query = query.where('timestamp', '>=', new Date(filters.startDate));
    }
    if (filters.endDate) {
      query = query.where('timestamp', '<=', new Date(filters.endDate));
    }

    const snapshot = await query.limit(10000).get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Format data based on requested format
    if (format === 'csv') {
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.json"`);
      res.json(logs);
    } else {
      // For PDF and Excel, return data for frontend processing
      res.json({
        success: true,
        data: logs,
        format
      });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
};

// Get audit statistics
export const getAuditStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user?.tenantId || 'default';
    const collectionName = `${tenantId}_audit_logs`;

    let query = db.collection(collectionName);

    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate as string));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate as string));
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const stats = {
      totalActions: logs.length,
      actionBreakdown: {} as Record<string, number>,
      resourceBreakdown: {} as Record<string, number>,
      userActivity: {} as Record<string, number>,
      successRate: 0,
      failureRate: 0,
      criticalActions: 0
    };

    logs.forEach(log => {
      // Action breakdown
      stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;
      
      // Resource breakdown
      stats.resourceBreakdown[log.resource] = (stats.resourceBreakdown[log.resource] || 0) + 1;
      
      // User activity
      stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
      
      // Success/failure rates
      if (log.success) {
        stats.successRate++;
      } else {
        stats.failureRate++;
      }
      
      // Critical actions
      if (log.details?.critical) {
        stats.criticalActions++;
      }
    });

    // Calculate percentages
    if (stats.totalActions > 0) {
      stats.successRate = (stats.successRate / stats.totalActions) * 100;
      stats.failureRate = (stats.failureRate / stats.totalActions) * 100;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit statistics'
    });
  }
};

// Helper function to convert logs to CSV
function convertToCSV(logs: any[]): string {
  if (logs.length === 0) return '';

  const headers = [
    'ID',
    'Timestamp',
    'User ID',
    'User Name',
    'User Role',
    'Action',
    'Resource',
    'Resource ID',
    'Success',
    'Error Message',
    'IP Address',
    'Details'
  ];

  const rows = logs.map(log => [
    log.id,
    log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : log.timestamp,
    log.userId || '',
    log.userName || '',
    log.userRole || '',
    log.action || '',
    log.resource || '',
    log.resourceId || '',
    log.success ? 'Yes' : 'No',
    log.errorMessage || '',
    log.ipAddress || '',
    log.details ? JSON.stringify(log.details) : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}