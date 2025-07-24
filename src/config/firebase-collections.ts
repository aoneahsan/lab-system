import { useTenantStore } from '@/stores/tenant.store';

// Get tenant prefix
const getTenantPrefix = () => {
	const tenantStore = useTenantStore.getState();
	return tenantStore.currentTenant?.id ? `${tenantStore.currentTenant.id}_` : 'labflow_';
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
	// Root collections (no tenant prefix)
	TENANTS: 'tenants',
	TENANT_USERS: 'tenant_users',
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