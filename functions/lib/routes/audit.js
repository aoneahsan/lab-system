"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_1 = require("../api/audit");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Create audit log
router.post('/', audit_1.createAuditLog);
// Search audit logs
router.get('/', audit_1.searchAuditLogs);
// Export audit logs
router.post('/export', audit_1.exportAuditLogs);
// Get audit statistics
router.get('/statistics', audit_1.getAuditStatistics);
// Get audit log by ID
router.get('/:id', audit_1.getAuditLogById);
// Get user activity
router.get('/user/:userId', audit_1.getUserActivity);
// Get resource history
router.get('/resource/:resource/:resourceId', audit_1.getResourceHistory);
exports.default = router;
//# sourceMappingURL=audit.js.map