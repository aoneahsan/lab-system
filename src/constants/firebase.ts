/**
 * Firebase Constants
 * Central location for all Firebase-related constants
 */

/**
 * Project prefix for multi-tenant data isolation
 */
export const PROJECT_PREFIX = 'labflow_';

/**
 * Collection names (without tenant prefix)
 */
export const COLLECTIONS = {
  // Core collections
  TENANTS: 'tenants',
  USERS: 'users',
  
  // Patient management
  PATIENTS: 'patients',
  PATIENT_DOCUMENTS: 'patient_documents',
  
  // Test management
  TESTS: 'tests',
  TEST_PANELS: 'test_panels',
  TEST_ORDERS: 'test_orders',
  
  // Sample tracking
  SAMPLES: 'samples',
  SAMPLE_TRACKING: 'sample_tracking',
  
  // Results management
  RESULTS: 'results',
  RESULT_TEMPLATES: 'result_templates',
  
  // Billing
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  INSURANCE_CLAIMS: 'insurance_claims',
  
  // Inventory management
  INVENTORY_ITEMS: 'inventory_items',
  STOCK_TRANSACTIONS: 'stock_transactions',
  LOTS: 'lots',
  PURCHASE_ORDERS: 'purchase_orders',
  INVENTORY_ALERTS: 'inventory_alerts',
  
  // Quality control
  QC_RUNS: 'qc_runs',
  QC_RULES: 'qc_rules',
  QC_MATERIALS: 'qc_materials',
  QC_STATISTICS: 'qc_statistics',
  
  // Reports
  REPORT_TEMPLATES: 'report_templates',
  GENERATED_REPORTS: 'generated_reports',
  REPORTS: 'reports',
  ANALYTICS_DASHBOARDS: 'analytics_dashboards',
  
  // Audit logs
  AUDIT_LOGS: 'audit_logs',
  
  // Settings
  SETTINGS: 'settings',
  
  // EMR integrations
  EMR_CONNECTIONS: 'emr_connections',
  EMR_MAPPINGS: 'emr_mappings',
  EMR_MESSAGES: 'emr_messages',
  EMR_FIELD_MAPPINGS: 'emr_field_mappings',
  EMR_INTEGRATION_LOGS: 'emr_integration_logs'
};

/**
 * Storage paths (without tenant prefix)
 */
export const STORAGE_PATHS = {
  // Patient files
  patient_documents: 'patients/documents',
  patient_photos: 'patients/photos',
  
  // Test results
  result_attachments: 'results/attachments',
  result_reports: 'results/reports',
  
  // Quality control
  qc_charts: 'qc/charts',
  
  // Reports
  generated_reports: 'reports/generated',
  report_templates: 'reports/templates',
  
  // Inventory
  inventory_images: 'inventory/images',
  msds_files: 'inventory/msds',
  
  // General
  company_logo: 'company/logo',
  user_avatars: 'users/avatars'
};

/**
 * Get collection name with tenant prefix
 */
export function getTenantCollection(collectionName: string, tenantId: string): string {
  return `${PROJECT_PREFIX}${tenantId}_${collectionName}`;
}

/**
 * Get storage path with tenant prefix
 */
export function getTenantStoragePath(path: string, tenantId: string): string {
  return `${PROJECT_PREFIX}${tenantId}/${path}`;
}