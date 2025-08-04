// Central export file for all types

// Auth and User types
export * from './auth.types';

// Core business types
export * from './patient.types';
export * from './test.types';
export * from './sample.types';
export * from './result.types';
export * from './order';

// Operational types
export * from './appointment.types';
export * from './billing.types';
export * from './inventory.types';
export * from './inventory';
export * from './qc.types';
export * from './quality-control';
export * from './report.types';

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
export * from './sample';

// Re-export commonly used types
export type { InventoryItem } from './inventory.types';
export type { Test, TestDefinition } from './test.types';
export type { User } from './auth.types';