import { Timestamp } from 'firebase/firestore';

export interface Sample {
  id: string;
  sampleId: string;
  barcode: string;
  orderId: string;
  patientId: string;
  patientName: string;
  type: 'blood' | 'urine' | 'stool' | 'swab' | 'tissue' | 'other';
  subType?: string;
  container: string;
  volume?: number;
  volumeUnit?: string;
  collectionDate: Timestamp;
  collectionTime: string;
  collectedBy: string;
  collectionSite?: string;
  status:
    | 'collected'
    | 'in_transit'
    | 'received'
    | 'processing'
    | 'completed'
    | 'rejected'
    | 'discarded';
  priority: 'routine' | 'urgent' | 'stat';
  storageLocation?: string;
  storageTemperature?: string;
  chainOfCustody: ChainOfCustodyEntry[];
  tests: string[];
  notes?: string;
  rejectionReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChainOfCustodyEntry {
  id: string;
  action: 'collected' | 'transported' | 'received' | 'processed' | 'stored' | 'discarded';
  performedBy: string;
  performedByName: string;
  timestamp: Timestamp;
  location?: string;
  temperature?: string;
  notes?: string;
}

export interface SampleStorage {
  id: string;
  location: string;
  type: 'refrigerator' | 'freezer' | 'room_temp' | 'incubator';
  temperature: string;
  capacity: number;
  currentOccupancy: number;
  sections: StorageSection[];
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StorageSection {
  id: string;
  name: string;
  rows: number;
  columns: number;
  positions: StoragePosition[];
}

export interface StoragePosition {
  row: number;
  column: number;
  sampleId?: string;
  isOccupied: boolean;
}
