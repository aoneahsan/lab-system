/**
 * Tenant-related constants for the LabFlow system
 * 
 * The project prefix is used to isolate data for multi-tenant architecture.
 * Each tenant will have their own unique prefix that is prepended to all
 * collection names, storage paths, and other resources.
 * 
 * Example: For a tenant "tenant1", collections would be:
 * - labflow_tenant1_patients
 * - labflow_tenant1_tests
 * - labflow_tenant1_samples
 * 
 * This ensures complete data isolation between tenants.
 */

export const PROJECT_PREFIX = 'labflow_';

export const TENANT_COLLECTION = 'tenants';

export const getTenantPrefix = (tenantId: string): string => {
  return `${PROJECT_PREFIX}${tenantId}_`;
};

export const getCollectionName = (tenantId: string, collectionName: string): string => {
  return `${getTenantPrefix(tenantId)}${collectionName}`;
};

export const getStoragePath = (tenantId: string, path: string): string => {
  return `${getTenantPrefix(tenantId)}${path}`;
};

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  LAB_ADMIN: 'lab_admin',
  LAB_MANAGER: 'lab_manager',
  LAB_TECHNICIAN: 'lab_technician',
  PHLEBOTOMIST: 'phlebotomist',
  PATHOLOGIST: 'pathologist',
  RADIOLOGIST: 'radiologist',
  BILLING_STAFF: 'billing_staff',
  FRONT_DESK: 'front_desk',
  CLINICIAN: 'clinician',
  PATIENT: 'patient',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const COLLECTION_NAMES = {
  USERS: 'users',
  PATIENTS: 'patients',
  TESTS: 'tests',
  SAMPLES: 'samples',
  RESULTS: 'results',
  BILLING: 'billing',
  INVENTORY: 'inventory',
  QUALITY_CONTROL: 'quality_control',
  AUDIT_LOGS: 'audit_logs',
  TEST_CATALOG: 'test_catalog',
  INSURANCE: 'insurance',
  APPOINTMENTS: 'appointments',
  REPORTS: 'reports',
} as const;

export type CollectionName = typeof COLLECTION_NAMES[keyof typeof COLLECTION_NAMES];