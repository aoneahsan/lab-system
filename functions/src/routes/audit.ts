import { Router } from 'express';
import {
  createAuditLog,
  searchAuditLogs,
  getAuditLogById,
  getUserActivity,
  getResourceHistory,
  exportAuditLogs,
  getAuditStatistics
} from '../api/audit';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create audit log
router.post('/', createAuditLog);

// Search audit logs
router.get('/', searchAuditLogs);

// Export audit logs
router.post('/export', exportAuditLogs);

// Get audit statistics
router.get('/statistics', getAuditStatistics);

// Get audit log by ID
router.get('/:id', getAuditLogById);

// Get user activity
router.get('/user/:userId', getUserActivity);

// Get resource history
router.get('/resource/:resource/:resourceId', getResourceHistory);

export default router;