import type { Timestamp } from 'firebase/firestore';

export type ResultStatus = 
  | 'pending'
  | 'in_progress'
  | 'preliminary'
  | 'final'
  | 'corrected'
  | 'cancelled';

export type ResultFlag = 
  | 'normal'
  | 'abnormal'
  | 'critical_high'
  | 'critical_low'
  | 'high'
  | 'low';

export type VerificationStatus = 
  | 'unverified'
  | 'verified'
  | 'reviewed'
  | 'approved'
  | 'rejected';

export interface ReferenceRange {
  min?: number;
  max?: number;
  unit: string;
  gender?: 'male' | 'female' | 'both';
  ageMin?: number;
  ageMax?: number;
  ageUnit?: 'days' | 'months' | 'years';
  interpretation?: string;
}

export interface TestResult {
  id: string;
  tenantId: string;
  orderId: string;
  sampleId: string;
  testId: string;
  patientId: string;
  
  // Test Information
  testCode: string;
  testName: string;
  loincCode?: string;
  
  // Result Data
  value: string | number;
  unit?: string;
  referenceRange?: ReferenceRange;
  flag: ResultFlag;
  status: ResultStatus;
  
  // Verification
  verificationStatus: VerificationStatus;
  performedBy: string;
  performedAt: Timestamp;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  
  // Additional Information
  method?: string;
  instrumentId?: string;
  instrumentName?: string;
  comments?: string;
  interpretation?: string;
  clinicalSignificance?: string;
  
  // Critical Result Handling
  isCritical: boolean;
  criticalNotifiedTo?: string;
  criticalNotifiedAt?: Timestamp;
  criticalAcknowledgedBy?: string;
  criticalAcknowledgedAt?: Timestamp;
  
  // History
  previousValue?: string | number;
  previousDate?: Timestamp;
  deltaChange?: number;
  deltaPercentage?: number;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
  version: number;
}

export interface ResultAmendment {
  id: string;
  resultId: string;
  amendmentType: 'correction' | 'addendum';
  reason: string;
  originalValue: string | number;
  newValue: string | number;
  amendedBy: string;
  amendedAt: Timestamp;
  comments?: string;
}

export interface ResultGroup {
  id: string;
  tenantId: string;
  orderId: string;
  sampleId: string;
  patientId: string;
  
  groupName: string;
  groupType: 'panel' | 'profile' | 'culture';
  results: TestResult[];
  
  overallStatus: ResultStatus;
  reportedAt?: Timestamp;
  reportedBy?: string;
  
  // Report Information
  reportTitle?: string;
  reportComments?: string;
  clinicalInterpretation?: string;
  recommendations?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResultReport {
  id: string;
  tenantId: string;
  orderId: string;
  patientId: string;
  
  reportType: 'final' | 'preliminary' | 'cumulative' | 'delta';
  reportNumber: string;
  reportDate: Timestamp;
  
  results: TestResult[];
  resultGroups?: ResultGroup[];
  
  // Report Metadata
  generatedBy: string;
  generatedAt: Timestamp;
  signedBy?: string;
  signedAt?: Timestamp;
  
  // Distribution
  sentTo?: string[];
  sentAt?: Timestamp;
  deliveryMethod?: 'fax' | 'email' | 'hl7' | 'print';
  
  // PDF Storage
  pdfUrl?: string;
  pdfGeneratedAt?: Timestamp;
}

export interface ResultFilter {
  patientId?: string;
  orderId?: string;
  sampleId?: string;
  testId?: string;
  status?: ResultStatus;
  verificationStatus?: VerificationStatus;
  flag?: ResultFlag;
  isCritical?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  performedBy?: string;
  verifiedBy?: string;
}

export interface ResultEntryFormData {
  orderId: string;
  sampleId: string;
  testId: string;
  value: string | number;
  unit?: string;
  flag?: ResultFlag;
  comments?: string;
  method?: string;
  instrumentId?: string;
}

export interface BatchResultEntryData {
  sampleId: string;
  results: {
    testId: string;
    value: string | number;
    unit?: string;
    flag?: ResultFlag;
  }[];
}

export interface ResultValidationRule {
  id: string;
  testId: string;
  ruleType: 'range' | 'delta' | 'absurd' | 'critical' | 'custom';
  
  // Range Validation
  minValue?: number;
  maxValue?: number;
  
  // Delta Check
  deltaThreshold?: number;
  deltaType?: 'absolute' | 'percentage';
  deltaTimeframe?: number; // days
  
  // Absurd Values
  absurdLow?: number;
  absurdHigh?: number;
  
  // Critical Values
  criticalLow?: number;
  criticalHigh?: number;
  
  // Custom Rule
  customRule?: string;
  customMessage?: string;
  
  // Actions
  action: 'warn' | 'block' | 'flag';
  requiresReview: boolean;
  notifyOnTrigger: boolean;
  
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResultStatistics {
  totalResults: number;
  todaysResults: number;
  pendingResults: number;
  criticalResults: number;
  resultsByStatus: Record<ResultStatus, number>;
  resultsByFlag: Record<ResultFlag, number>;
  averageTurnaroundTime: number; // in hours
  verificationRate: number; // percentage
}