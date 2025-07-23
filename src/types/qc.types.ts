import { Timestamp } from 'firebase/firestore';

// QC Material types
export interface QCMaterial {
  id: string;
  tenantId: string;
  
  // Basic info
  name: string;
  manufacturer: string;
  catalogNumber: string;
  lotNumber: string;
  
  // Material details
  level: QCLevel;
  matrix: string; // e.g., serum, urine, whole blood
  description?: string;
  
  // Storage
  storageTemp: string; // e.g., "2-8°C", "-20°C"
  storageLocation?: string;
  
  // Dates
  expirationDate: Timestamp;
  receivedDate: Timestamp;
  openedDate?: Timestamp;
  inUseExpirationDate?: Timestamp;
  
  // Status
  active: boolean;
  
  // Analytes with target values and ranges
  analytes: QCAnalyte[];
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface QCAnalyte {
  testCode: string;
  testName: string;
  unit: string;
  
  // Target values
  targetMean: number;
  targetSD: number;
  targetCV?: number;
  
  // Acceptable ranges
  acceptableRange: {
    min: number;
    max: number;
  };
  
  // Westgard rules to apply
  westgardRules: WestgardRule[];
}

// QC Run types
export interface QCRun {
  id: string;
  tenantId: string;
  
  // Run identification
  runNumber: string;
  runDate: Timestamp;
  shift: Shift;
  
  // Material reference
  materialId: string;
  materialName: string;
  materialLot: string;
  level: QCLevel;
  
  // Instrument/Method
  instrumentId?: string;
  instrumentName?: string;
  methodName?: string;
  
  // Run details
  operator: string;
  operatorId: string;
  temperature?: number; // Room temp
  humidity?: number;
  
  // Results
  results: QCResult[];
  
  // Overall status
  status: QCRunStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  comments?: string;
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface QCResult {
  id: string;
  
  // Test identification
  testCode: string;
  testName: string;
  
  // Result details
  value: number;
  unit: string;
  
  // QC evaluation
  status: QCResultStatus;
  zscore?: number;
  violatedRules: WestgardViolation[];
  
  // Flags
  isOutlier: boolean;
  isExcluded: boolean;
  excludeReason?: string;
  
  // Corrective action
  correctiveAction?: string;
  actionTaken?: string;
  
  // Timestamps
  resultTime: Timestamp;
  enteredBy: string;
}

// QC Statistics
export interface QCStatistics {
  id: string;
  tenantId: string;
  
  // Identification
  materialId: string;
  testCode: string;
  level: QCLevel;
  
  // Time period
  periodStart: Timestamp;
  periodEnd: Timestamp;
  
  // Statistical values
  n: number; // Number of data points
  mean: number;
  sd: number;
  cv: number;
  
  // Additional stats
  min: number;
  max: number;
  median: number;
  
  // Performance metrics
  bias: number; // % difference from target
  totalError: number;
  sigma: number; // Six Sigma metric
  
  // Data points for charts
  dataPoints: QCDataPoint[];
  
  // Metadata
  calculatedAt: Timestamp;
  calculatedBy: string;
}

export interface QCDataPoint {
  runId: string;
  runDate: Timestamp;
  value: number;
  zscore: number;
  status: QCResultStatus;
  isExcluded: boolean;
}

// Westgard Rules
export interface WestgardViolation {
  rule: WestgardRule;
  description: string;
  severity: 'warning' | 'rejection';
  dataPoints?: number[]; // Values that triggered the rule
}

// Enums
export type QCLevel = 'level1' | 'level2' | 'level3' | 'abnormal' | 'normal';

export type Shift = 'day' | 'evening' | 'night';

export type QCRunStatus = 'in_progress' | 'completed' | 'accepted' | 'rejected' | 'reviewed';

export type QCResultStatus = 'pass' | 'warning' | 'fail' | 'excluded';

export type WestgardRule = 
  | '12s'   // 1 control exceeds 2SD
  | '13s'   // 1 control exceeds 3SD
  | '22s'   // 2 consecutive controls exceed 2SD on same side
  | 'R4s'   // Range of 2 consecutive controls exceeds 4SD
  | '41s'   // 4 consecutive controls exceed 1SD on same side
  | '10x'   // 10 consecutive controls on same side of mean
  | '7T'    // 7 consecutive controls trending in same direction
  | '8x'    // 8 consecutive controls on same side of mean
  | '9x'    // 9 consecutive controls on same side of mean
  | '2of32s' // 2 of 3 controls exceed 2SD
  | '31s';   // 3 consecutive controls exceed 1SD

// Form data types
export interface QCMaterialFormData {
  name: string;
  manufacturer: string;
  catalogNumber: string;
  lotNumber: string;
  level: QCLevel;
  matrix: string;
  description?: string;
  storageTemp: string;
  storageLocation?: string;
  expirationDate: Date;
  receivedDate: Date;
  openedDate?: Date;
  analytes: Omit<QCAnalyte, 'westgardRules'>[];
}

export interface QCRunFormData {
  materialId: string;
  runDate: Date;
  shift: Shift;
  instrumentId?: string;
  temperature?: number;
  humidity?: number;
  results: Array<{
    testCode: string;
    value: number;
  }>;
  comments?: string;
}

// Filter types
export interface QCFilter {
  materialId?: string;
  testCode?: string;
  level?: QCLevel;
  startDate?: Date;
  endDate?: Date;
  status?: QCResultStatus;
  shift?: Shift;
}

// Chart data types
export interface LeveyJenningsData {
  testName: string;
  unit: string;
  mean: number;
  sd: number;
  ucl: number; // Upper control limit (+3SD)
  uwl: number; // Upper warning limit (+2SD)
  lcl: number; // Lower control limit (-3SD)
  lwl: number; // Lower warning limit (-2SD)
  points: Array<{
    date: Date;
    value: number;
    status: QCResultStatus;
    runId: string;
    violatedRules: string[];
  }>;
}

// Dashboard statistics
export interface QCDashboardStats {
  totalRuns: number;
  passRate: number;
  failureRate: number;
  pendingReview: number;
  
  byLevel: Record<QCLevel, {
    runs: number;
    passRate: number;
  }>;
  
  byTest: Array<{
    testCode: string;
    testName: string;
    runs: number;
    passRate: number;
    cv: number;
  }>;
  
  recentViolations: Array<{
    runId: string;
    runDate: Timestamp;
    testName: string;
    level: QCLevel;
    violations: WestgardViolation[];
  }>;
  
  expiringMaterials: Array<{
    id: string;
    name: string;
    lotNumber: string;
    expirationDate: Timestamp;
    daysUntilExpiration: number;
  }>;
}