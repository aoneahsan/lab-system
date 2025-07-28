import { useTenantStore } from '@/stores/tenant.store';

// Get tenant prefix
const getTenantPrefix = () => {
  const tenantStore = useTenantStore.getState();
  return tenantStore.currentTenant?.id ? `labflow_${tenantStore.currentTenant.id}_` : 'labflow_';
};

// Collection names with tenant prefix
export const getCollectionName = (collection: string) => {
  return `${getTenantPrefix()}${collection}`;
};

// Storage paths with tenant prefix
export const getStoragePath = (path: string) => {
  return `${getTenantPrefix()}/${path}`;
};

// Pre-defined collections
export const COLLECTIONS = {
  get PATIENTS() {
    return getCollectionName('patients');
  },
  get TESTS() {
    return getCollectionName('tests');
  },
  get SAMPLES() {
    return getCollectionName('samples');
  },
  get RESULTS() {
    return getCollectionName('results');
  },
  get INVENTORY() {
    return getCollectionName('inventory');
  },
  get INVENTORY_TRANSACTIONS() {
    return getCollectionName('inventory_transactions');
  },
  get INVOICES() {
    return getCollectionName('invoices');
  },
  get PAYMENTS() {
    return getCollectionName('payments');
  },
  get QC_MATERIALS() {
    return getCollectionName('qc_materials');
  },
  get QC_RUNS() {
    return getCollectionName('qc_runs');
  },
  get QC_STATISTICS() {
    return getCollectionName('qc_statistics');
  },
  get USERS() {
    return getCollectionName('users');
  },
  get AUDIT_LOGS() {
    return getCollectionName('audit_logs');
  },
  get REPORTS() {
    return getCollectionName('reports');
  },
  get REPORT_TEMPLATES() {
    return getCollectionName('report_templates');
  },
  get SCHEDULED_REPORTS() {
    return getCollectionName('scheduled_reports');
  },
  get WEBHOOKS() {
    return getCollectionName('webhooks');
  },
  get WEBHOOK_LOGS() {
    return getCollectionName('webhook_logs');
  },
  get TEST_PANELS() {
    return getCollectionName('test_panels');
  },
  get CRITICAL_VALUES() {
    return getCollectionName('critical_values');
  },
  get PATIENT_ALERTS() {
    return getCollectionName('patient_alerts');
  },
  get RESULT_GROUPS() {
    return getCollectionName('result_groups');
  },
  get RESULT_REPORTS() {
    return getCollectionName('result_reports');
  },
  get INSURANCE_CLAIMS() {
    return getCollectionName('insurance_claims');
  },
  get INSURANCE_PROVIDERS() {
    return getCollectionName('insurance_providers');
  },
  get PATIENT_INSURANCE() {
    return getCollectionName('patient_insurance');
  },
  get INSURANCE_ELIGIBILITY() {
    return getCollectionName('insurance_eligibility');
  },
  get CRITICAL_NOTIFICATIONS() {
    return getCollectionName('critical_notifications');
  },
  get BATCHES() {
    return getCollectionName('batches');
  },
  get SAMPLE_COLLECTIONS() {
    return getCollectionName('sampleCollections');
  },
  get INVENTORY_ITEMS() {
    return getCollectionName('inventory_items');
  },
  get STOCK_TRANSACTIONS() {
    return getCollectionName('stock_transactions');
  },
  get LOTS() {
    return getCollectionName('lots');
  },
  get PURCHASE_ORDERS() {
    return getCollectionName('purchase_orders');
  },
  get INVENTORY_ALERTS() {
    return getCollectionName('inventory_alerts');
  },
  get QC_TESTS() {
    return getCollectionName('qc_tests');
  },
  get QC_RESULTS() {
    return getCollectionName('qc_results');
  },
  get ANALYTICS_DASHBOARDS() {
    return getCollectionName('analytics_dashboards');
  },
  get RESULT_VALIDATIONS() {
    return getCollectionName('resultValidations');
  },
  get TEST_ORDERS() {
    return getCollectionName('test_orders');
  },
  get SETTINGS() {
    return getCollectionName('settings');
  },
  get EMR_CONNECTIONS() {
    return getCollectionName('emr_connections');
  },
  get EMR_MESSAGES() {
    return getCollectionName('emr_messages');
  },
  get EMR_INTEGRATION_LOGS() {
    return getCollectionName('emr_integration_logs');
  },
  get PAYMENT_RECONCILIATIONS() {
    return getCollectionName('payment_reconciliations');
  },
  get PAYMENT_PLANS() {
    return getCollectionName('payment_plans');
  },
  get ORDERS() {
    return getCollectionName('orders');
  },
  // Root collections (no tenant prefix)
  TENANTS: 'tenants',
  TENANT_USERS: 'tenant_users',
  // Non-tenant prefixed collections for shared data
  LABFLOW_TESTS: 'labflow_tests',
  LABFLOW_TEST_PANELS: 'labflow_test_panels',
  LABFLOW_TEST_ORDERS: 'labflow_test_orders',
  LABFLOW_SPECIMENS: 'labflow_specimens',
};

// Storage paths
export const STORAGE_PATHS = {
  get PATIENT_PHOTOS() {
    return getStoragePath('patients/photos');
  },
  get PATIENT_DOCUMENTS() {
    return getStoragePath('patients/documents');
  },
  get RESULTS() {
    return getStoragePath('results');
  },
  get REPORTS() {
    return getStoragePath('reports');
  },
  get INVOICES() {
    return getStoragePath('invoices');
  },
  get QC_DOCUMENTS() {
    return getStoragePath('qc/documents');
  },
};
