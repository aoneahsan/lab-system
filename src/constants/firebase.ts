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
  tenants: 'tenants',
  users: 'users',
  
  // Patient management
  patients: 'patients',
  patient_documents: 'patient_documents',
  
  // Test management
  tests: 'tests',
  test_panels: 'test_panels',
  test_orders: 'test_orders',
  
  // Sample tracking
  samples: 'samples',
  sample_tracking: 'sample_tracking',
  
  // Results management
  results: 'results',
  result_templates: 'result_templates',
  
  // Billing
  invoices: 'invoices',
  payments: 'payments',
  insurance_claims: 'insurance_claims',
  
  // Inventory management
  inventory_items: 'inventory_items',
  stock_transactions: 'stock_transactions',
  lots: 'lots',
  purchase_orders: 'purchase_orders',
  inventory_alerts: 'inventory_alerts',
  
  // Quality control
  qc_runs: 'qc_runs',
  qc_rules: 'qc_rules',
  
  // Reports
  report_templates: 'report_templates',
  generated_reports: 'generated_reports',
  
  // Audit logs
  audit_logs: 'audit_logs',
  
  // Settings
  settings: 'settings',
  
  // EMR integrations
  emr_connections: 'emr_connections',
  emr_mappings: 'emr_mappings'
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