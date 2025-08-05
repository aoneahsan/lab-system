/**
 * Helper functions for Firebase collection names
 * This provides a consistent way to get collection names with tenant prefix
 */

import { useTenantStore } from '@/stores/tenant.store';

// Project prefix constant
const PROJECT_PREFIX = 'labflow';

/**
 * Get collection name with tenant prefix
 * Can be used with either current tenant from store or explicit tenantId
 */
export const getFirestoreCollectionName = (collectionName: string, tenantId?: string): string => {
  // If tenantId is provided, use it
  if (tenantId) {
    return `${PROJECT_PREFIX}_${tenantId}_${collectionName}`;
  }

  // Otherwise, get from tenant store
  const currentTenant = useTenantStore.getState().currentTenant;
  if (!currentTenant?.id) {
    console.warn('No tenant ID available for collection:', collectionName);
    // Return with just project prefix as fallback
    return `${PROJECT_PREFIX}_${collectionName}`;
  }

  return `${PROJECT_PREFIX}_${currentTenant.id}_${collectionName}`;
};

/**
 * Get storage path with tenant prefix
 */
export const getFirestoreStoragePath = (path: string, tenantId?: string): string => {
  // If tenantId is provided, use it
  if (tenantId) {
    return `${PROJECT_PREFIX}_${tenantId}/${path}`;
  }

  // Otherwise, get from tenant store
  const currentTenant = useTenantStore.getState().currentTenant;
  if (!currentTenant?.id) {
    console.warn('No tenant ID available for storage path:', path);
    return `${PROJECT_PREFIX}/${path}`;
  }

  return `${PROJECT_PREFIX}_${currentTenant.id}/${path}`;
};

// Collection name constants (without tenant prefix)
export const COLLECTION_NAMES = {
  // Core collections
  PATIENTS: 'patients',
  TESTS: 'tests',
  SAMPLES: 'samples',
  RESULTS: 'results',

  // Inventory
  INVENTORY_ITEMS: 'inventory_items',
  STOCK_TRANSACTIONS: 'stock_transactions',
  LOTS: 'lots',
  PURCHASE_ORDERS: 'purchase_orders',
  INVENTORY_ALERTS: 'inventory_alerts',
  VENDORS: 'vendors',

  // Quality Control
  QC_TESTS: 'qc_tests',
  QC_RESULTS: 'qc_results',
  QC_MATERIALS: 'qc_materials',
  QC_RUNS: 'qc_runs',
  QC_STATISTICS: 'qc_statistics',

  // Billing
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  INSURANCE_CLAIMS: 'insurance_claims',
  INSURANCE_PROVIDERS: 'insurance_providers',
  PATIENT_INSURANCE: 'patient_insurance',
  INSURANCE_ELIGIBILITY: 'insurance_eligibility',

  // Reports
  REPORTS: 'reports',
  REPORT_TEMPLATES: 'report_templates',
  SCHEDULED_REPORTS: 'scheduled_reports',
  ANALYTICS_DASHBOARDS: 'analytics_dashboards',

  // Other
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
  WEBHOOKS: 'webhooks',
  WEBHOOK_LOGS: 'webhook_logs',
  TEST_PANELS: 'test_panels',
  CRITICAL_VALUES: 'critical_values',
  PATIENT_ALERTS: 'patient_alerts',
  RESULT_GROUPS: 'result_groups',
  RESULT_REPORTS: 'result_reports',
  CRITICAL_NOTIFICATIONS: 'critical_notifications',
  BATCHES: 'batches',
  SAMPLE_COLLECTIONS: 'sampleCollections',
  RESULT_VALIDATIONS: 'resultValidations',
  TEST_ORDERS: 'test_orders',
  SETTINGS: 'settings',
  CUSTOM_FIELDS: 'custom_fields',
} as const;

// Root collections (no tenant prefix)
export const ROOT_COLLECTIONS = {
  TENANTS: 'tenants',
  TENANT_USERS: 'tenant_users',
} as const;

// Shared collections (with labflow prefix but no tenant)
export const SHARED_COLLECTIONS = {
  LABFLOW_TESTS: 'labflow_tests',
  LABFLOW_TEST_PANELS: 'labflow_test_panels',
  LABFLOW_TEST_ORDERS: 'labflow_test_orders',
  LABFLOW_SPECIMENS: 'labflow_specimens',
} as const;
