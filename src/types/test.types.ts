import type { Timestamp } from 'firebase/firestore';

export interface LOINCCode {
  code: string;
  displayName: string;
  longCommonName?: string;
  shortName?: string;
  class?: string;
  classType?: number;
  system?: string;
  component?: string;
  property?: string;
  timeAspect?: string;
  method?: string;
  scale?: string;
  status?: string;
}

export interface TestDefinition {
  id: string;
  tenantId: string;
  name: string;
  code: string; // Internal lab code
  loincCode?: LOINCCode;
  category:
    | 'chemistry'
    | 'hematology'
    | 'microbiology'
    | 'immunology'
    | 'pathology'
    | 'genetics'
    | 'other';
  department?: string;
  specimen: {
    type: 'blood' | 'urine' | 'stool' | 'sputum' | 'csf' | 'tissue' | 'swab' | 'other';
    volume?: number;
    volumeUnit?: 'ml' | 'mg' | 'g';
    container?: string;
    preservative?: string;
    specialInstructions?: string;
  };
  methodology?: string;
  referenceRanges: ReferenceRange[];
  turnaroundTime: {
    routine: number; // in hours
    stat?: number; // in hours
  };
  criticalValues?: {
    low?: number;
    high?: number;
  };
  unit?: string;
  decimalPlaces?: number;
  resultType: 'numeric' | 'text' | 'coded' | 'structured';
  resultOptions?: string[]; // For coded results
  isActive: boolean;
  isOrderable: boolean;
  requiresApproval?: boolean;
  cost?: number;
  price?: number; // Patient price (may differ from cost)
  cptCode?: string;
  notes?: string;
  customFields?: Record<string, any>;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface ReferenceRange {
  id: string;
  ageMin?: number;
  ageMax?: number;
  ageUnit?: 'days' | 'months' | 'years';
  gender?: 'male' | 'female' | 'other';
  normalMin?: number;
  normalMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  textRange?: string; // For non-numeric results
  condition?: string; // e.g., "pregnant", "fasting"
  notes?: string;
}

export interface TestPanel {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  category: string;
  testIds: string[]; // References to TestDefinition IDs
  isActive: boolean;
  description?: string;
  totalCost?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  updatedBy: string;
}

// Alias for backwards compatibility
export type Test = TestDefinition;

export interface TestOrder {
  id: string;
  tenantId: string;
  patientId: string;
  visitId?: string;
  orderNumber: string;
  tests: OrderedTest[];
  orderingProviderId: string;
  orderingProviderName: string;
  orderDate: Date | Timestamp;
  priority: 'routine' | 'stat' | 'asap';
  clinicalHistory?: string;
  diagnosis?: string;
  icdCodes?: string[];
  fasting?: boolean;
  collectionDateTime?: Date | Timestamp;
  specimenId?: string;
  status:
    | 'pending'
    | 'awaiting_approval'
    | 'approved'
    | 'specimen_collected'
    | 'in_progress'
    | 'resulted'
    | 'cancelled'
    | 'rejected';
  cancelReason?: string;
  rejectionReason?: string;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: Date | Timestamp;
  rejectedBy?: string;
  rejectedAt?: Date | Timestamp;
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface OrderedTest {
  testId: string;
  testName: string;
  testCode: string;
  specimenType?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  resultId?: string;
  notes?: string;
}

export interface TestResult {
  id: string;
  tenantId: string;
  orderId: string;
  testId: string;
  patientId: string;
  testName: string;
  testCode: string;
  loincCode?: string;
  result: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low' | 'abnormal';
  status: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  performedBy?: string;
  performedDate?: Date | Timestamp;
  verifiedBy?: string;
  verifiedDate?: Date | Timestamp;
  comments?: string;
  methodology?: string;
  instrumentId?: string;
  qcStatus?: 'passed' | 'failed' | 'warning';
  deltaCheck?: {
    previousValue?: string | number;
    previousDate?: Date | Timestamp;
    percentChange?: number;
    flagged?: boolean;
  };
  criticalNotified?: {
    notifiedBy: string;
    notifiedTo: string;
    notifiedAt: Date | Timestamp;
    method: 'phone' | 'sms' | 'email' | 'in_person';
    notes?: string;
  };
  amendments?: ResultAmendment[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface ResultAmendment {
  id: string;
  previousValue: string | number;
  newValue: string | number;
  reason: string;
  amendedBy: string;
  amendedAt: Date | Timestamp;
}

// Form types for creating/updating tests
export interface TestDefinitionFormData {
  name: string;
  code: string;
  loincCode?: string;
  category: TestDefinition['category'];
  department?: string;
  specimen: {
    type: TestDefinition['specimen']['type'];
    volume?: number;
    volumeUnit?: 'ml' | 'mg' | 'g';
    container?: string;
    preservative?: string;
    specialInstructions?: string;
  };
  methodology?: string;
  turnaroundTime: {
    routine: number;
    stat?: number;
  };
  criticalValues?: {
    low?: number;
    high?: number;
  };
  unit?: string;
  decimalPlaces?: number;
  resultType: TestDefinition['resultType'];
  resultOptions?: string[];
  isActive: boolean;
  isOrderable: boolean;
  requiresApproval?: boolean;
  cost?: number;
  price?: number; // Patient price (may differ from cost)
  cptCode?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface TestOrderFormData {
  patientId: string;
  tests: string[]; // Test IDs
  priority: 'routine' | 'stat' | 'asap';
  clinicalHistory?: string;
  diagnosis?: string;
  icdCodes?: string[];
  fasting?: boolean;
  notes?: string;
}

// Filter types
export interface TestFilter {
  searchTerm?: string;
  category?: string;
  department?: string;
  isActive?: boolean;
  specimenType?: string;
}

export interface TestOrderFilter {
  searchTerm?: string;
  status?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
  patientId?: string;
  providerId?: string;
}
