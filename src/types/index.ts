// Central export file for all types

// Auth and User types
export * from './auth.types';

// Core business types
export * from './patient.types';
// Export everything except ReferenceRange from test.types
export type {
  TestDefinition,
  TestPanel,
  TestOrder,
  OrderedTest,
  TestResult,
  ResultAmendment,
  TestDefinitionFormData,
  TestOrderFormData,
  TestFilter,
  TestOrderFilter,
  LOINCCode,
  Test
} from './test.types';
export type { ReferenceRange as TestReferenceRange } from './test.types';
// Export everything from result.types including its ReferenceRange
export * from './result.types';
// Specific exports from order to avoid conflicts
export type { 
  Specimen
} from './order';

// Sample types
export * from './sample.types';

// Operational types
export * from './appointment.types';
// Specific exports from billing to avoid conflicts with patient types
export type {
  Invoice,
  InvoiceStatus,
  InvoiceFormData,
  Payment,
  PaymentMethod,
  PaymentStatus,
  InvoiceItem,
  InsuranceClaim,
  ClaimStatus,
  ClaimFormData,
  PaymentFormData,
  InsuranceProvider,
  InsurancePlan,
  PatientInsurance,
  ClaimService,
  BillingFilter,
  BillingStatistics,
  ClaimFilter,
  ClaimStatistics,
  InsuranceEligibility
} from './billing.types';
export * from './inventory.types';
export * from './report.types';

// Quality Control types
export * from './qc.types';

// System types
export * from './tenant.types';
export * from './notification.types';
export * from './biometric.types';
export * from './communication.types';
export * from './offline';

// Integration types
export * from './emr.types';
export * from './webhook.types';
export * from './workflow-automation.types';

// Portal types
export * from './customer-portal.types';
export * from './home-collection.types';

// Re-export commonly used types
export type { InventoryItem } from './inventory.types';
export type { User } from './auth.types';