import { Timestamp } from 'firebase/firestore';

export interface TestOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientDOB: Date;
  orderingProviderId: string;
  orderingProviderName: string;
  facilityId?: string;
  facilityName?: string;
  orderDate: Timestamp;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'collected' | 'in_progress' | 'completed' | 'cancelled';
  tests: OrderedTest[];
  diagnosis?: string[];
  icdCodes?: string[];
  clinicalNotes?: string;
  fastingRequired: boolean;
  specialInstructions?: string;
  barcode?: string;
  collectionDate?: Timestamp;
  collectedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderedTest {
  testId: string;
  testCode: string;
  testName: string;
  specimenType: string;
  tubeType?: string;
  status: 'pending' | 'collected' | 'received' | 'in_progress' | 'resulted' | 'verified';
  priority?: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

export interface Specimen {
  id: string;
  orderId: string;
  patientId: string;
  specimenNumber: string;
  barcode: string;
  type: string;
  source?: string;
  volume?: number;
  unit?: string;
  collectionDate: Timestamp;
  collectionTime: string;
  collectedBy: string;
  receivedDate?: Timestamp;
  receivedBy?: string;
  status: 'collected' | 'in_transit' | 'received' | 'processing' | 'stored' | 'discarded';
  storageLocation?: string;
  temperature?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}