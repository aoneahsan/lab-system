import type { Timestamp } from 'firebase/firestore';

export interface TestResult {
  id: string;
  tenantId: string;
  orderId: string;
  patientId: string;
  sampleId: string;
  testId: string;
  testName: string;
  category: string;
  value: string | number;
  unit?: string;
  referenceRange?: ReferenceRange;
  flag?: ResultFlag;
  status: ResultStatus;
  method?: string;
  equipment?: string;
  enteredBy: string;
  enteredAt: Timestamp;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  comments?: string;
  criticalNotified?: boolean;
  criticalNotifiedAt?: Timestamp;
  criticalNotifiedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReferenceRange {
  min?: number;
  max?: number;
  normal?: string;
  unit?: string;
  ageGroup?: string;
  gender?: 'male' | 'female' | 'both';
}

export type ResultFlag =
  | 'H'
  | 'L'
  | 'HH'
  | 'LL'
  | 'A'
  | 'AA'
  | 'normal'
  | 'low'
  | 'high'
  | 'critical_low'
  | 'critical_high';

export type ResultStatus = 'pending' | 'entered' | 'verified' | 'amended' | 'cancelled';

export interface ResultValidation {
  id: string;
  tenantId: string;
  testId: string;
  ruleName: string;
  ruleType: ValidationRuleType;
  enabled: boolean;
  parameters: ValidationParameters;
  action: ValidationAction;
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ValidationRuleType =
  | 'range'
  | 'delta'
  | 'critical'
  | 'absurd'
  | 'consistency'
  | 'calculated';

export interface ValidationParameters {
  min?: number;
  max?: number;
  deltaPercent?: number;
  deltaValue?: number;
  criticalLow?: number;
  criticalHigh?: number;
  formula?: string;
  dependentTests?: string[];
}

export type ValidationAction = 'warn' | 'block' | 'notify';

export interface ResultEntry {
  orderId: string;
  sampleId: string;
  tests: ResultEntryTest[];
}

export interface ResultEntryTest {
  testId: string;
  testName: string;
  value: string | number;
  unit?: string;
  flag?: ResultFlag;
  comments?: string;
}

export interface ResultEntryFormData {
  orderId: string;
  sampleId: string;
  tests: ResultEntryTest[];
}

export type ResultValidationRule = ResultValidation;

export interface ResultFilter {
  status?: ResultStatus;
  flag?: ResultFlag;
  dateRange?: {
    start: Date;
    end: Date;
  };
  patientId?: string;
  orderId?: string;
  testId?: string;
  clinicianId?: string;
}

export interface BatchResultEntryData {
  orderId: string;
  results: Array<{
    sampleId: string;
    testId: string;
    value: string | number;
    unit?: string;
    flag?: ResultFlag;
    comments?: string;
  }>;
}

export interface DetailedTestResult extends TestResult {
  patientName?: string;
  patientMRN?: string;
  orderNumber?: string;
  testCode?: string;
  collectionDate?: Timestamp;
  resultDate?: Timestamp;
  performedBy?: string;
  notes?: string;
  isCritical?: boolean;
  history?: Array<{
    date: Date;
    value: string | number;
    abnormal: boolean;
  }>;
}
