import type { Timestamp } from 'firebase/firestore';

export interface Sample {
  id: string;
  tenantId: string;
  orderId: string;
  patientId: string;
  sampleNumber: string;
  barcode: string;
  qrCode?: string;
  type: SampleType;
  container: ContainerType;
  volume?: number;
  volumeUnit?: 'ml' | 'ul';
  collectionDate: Timestamp;
  collectionTime: string;
  collectedBy: string;
  collectionSite?: string;
  status: SampleStatus;
  priority: 'routine' | 'stat' | 'asap';
  tests: string[]; // Test IDs
  departmentId?: string; // Department assignment
  analyzerId?: string; // Analyzer assignment
  storageLocation?: string;
  storageTemperature?: StorageTemperature;
  expirationDate?: Timestamp;
  rejectionReason?: string;
  notes?: string;
  chainOfCustody: ChainOfCustodyEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export type SampleType =
  | 'blood'
  | 'serum'
  | 'plasma'
  | 'urine'
  | 'stool'
  | 'csf'
  | 'tissue'
  | 'swab'
  | 'sputum'
  | 'other';

export type ContainerType =
  | 'edta_tube'
  | 'sst_tube'
  | 'sodium_citrate_tube'
  | 'heparin_tube'
  | 'urine_cup'
  | 'sterile_container'
  | 'swab_transport'
  | 'other';

export type SampleStatus =
  | 'pending_collection'
  | 'collected'
  | 'in_transit'
  | 'received'
  | 'processing'
  | 'stored'
  | 'completed'
  | 'rejected'
  | 'expired';

export type StorageTemperature = 'room_temp' | 'refrigerated' | 'frozen' | 'ultra_frozen';

export interface ChainOfCustodyEntry {
  timestamp: Timestamp;
  action: CustodyAction;
  userId: string;
  userName: string;
  location?: string;
  notes?: string;
}

export type CustodyAction =
  | 'collected'
  | 'transported'
  | 'received'
  | 'processed'
  | 'stored'
  | 'retrieved'
  | 'disposed';

export interface SampleCollection {
  id: string;
  tenantId: string;
  orderId: string;
  patientId: string;
  scheduledDate: Timestamp;
  scheduledTime?: string;
  collectionSite: string;
  phlebotomistId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  samples: CollectionSample[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface CollectionSample {
  testId: string;
  testName: string;
  sampleType: SampleType;
  container: ContainerType;
  volume?: number;
  instructions?: string;
  collected: boolean;
  sampleId?: string;
}

export interface SampleLabel {
  sampleId: string;
  patientName: string;
  patientDOB: string;
  medicalRecordNumber: string;
  sampleNumber: string;
  barcode: string;
  qrCode?: string;
  collectionDate: string;
  collectionTime: string;
  sampleType: string;
  tests: string[];
  priority: string;
  specialInstructions?: string;
}

export interface SampleFilter {
  status?: SampleStatus;
  type?: SampleType;
  priority?: 'routine' | 'stat' | 'asap';
  patientId?: string;
  orderId?: string;
  collectedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface SampleFormData {
  orderId: string;
  patientId: string;
  type: SampleType;
  container: ContainerType;
  volume?: number;
  volumeUnit?: 'ml' | 'ul';
  collectionDate: Date;
  collectionTime: string;
  collectedBy: string;
  collectionSite?: string;
  priority: 'routine' | 'stat' | 'asap';
  tests: string[];
  storageLocation?: string;
  storageTemperature?: StorageTemperature;
  notes?: string;
}

export interface BarcodeConfig {
  prefix: string;
  format: 'CODE128' | 'CODE39' | 'EAN13';
  includeText: boolean;
  width: number;
  height: number;
}

export interface QRCodeConfig {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  includeMargin: boolean;
  color: {
    dark: string;
    light: string;
  };
}

export interface BatchProcessingResult {
  successful: string[];
  failed: Array<{
    sampleId: string;
    error: string;
  }>;
  total: number;
}

export interface BatchRoutingAssignment {
  sampleId: string;
  department?: string;
  analyzer?: string;
  priority?: 'routine' | 'stat' | 'asap';
}

export interface LabelTemplate {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large' | 'custom';
  width?: number;
  height?: number;
  includeTestInfo: boolean;
  includePatientInfo: boolean;
  includeQRCode: boolean;
  includeBarcode: boolean;
  customFields?: string[];
}
