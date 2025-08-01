export interface OfflinePatient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  lastModified: number;
  [key: string]: any;
}

export interface OfflineOrder {
  id: string;
  orderId: string;
  patientId: string;
  orderDate: string;
  status: string;
  tests: string[];
  priority: string;
  lastModified: number;
  [key: string]: any;
}

export interface OfflineResult {
  id: string;
  resultId: string;
  orderId: string;
  testId: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: string;
  lastModified: number;
  [key: string]: any;
}

export interface OfflineTest {
  id: string;
  testId: string;
  name: string;
  code: string;
  category: string;
  turnaroundTime?: number;
  price?: number;
  [key: string]: any;
}

export interface OfflineQueueItem {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface SyncMetadata {
  collection: string;
  lastSyncTime: number;
  recordCount: number;
  lastError?: string;
}

export interface OfflineDatabase {
  initialize(): Promise<void>;
  
  // Patient operations
  getPatients(): Promise<OfflinePatient[]>;
  getPatient(id: string): Promise<OfflinePatient | undefined>;
  savePatient(patient: OfflinePatient): Promise<void>;
  deletePatient(id: string): Promise<void>;
  
  // Order operations
  getOrders(): Promise<OfflineOrder[]>;
  getOrder(id: string): Promise<OfflineOrder | undefined>;
  saveOrder(order: OfflineOrder): Promise<void>;
  deleteOrder(id: string): Promise<void>;
  
  // Result operations
  getResults(): Promise<OfflineResult[]>;
  getResult(id: string): Promise<OfflineResult | undefined>;
  saveResult(result: OfflineResult): Promise<void>;
  deleteResult(id: string): Promise<void>;
  
  // Test operations
  getTests(): Promise<OfflineTest[]>;
  getTest(id: string): Promise<OfflineTest | undefined>;
  saveTest(test: OfflineTest): Promise<void>;
  deleteTest(id: string): Promise<void>;
  
  // Offline queue operations
  getQueueItems(): Promise<OfflineQueueItem[]>;
  addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void>;
  removeFromQueue(id: string): Promise<void>;
  updateQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void>;
  
  // Sync metadata
  getSyncMetadata(): Promise<SyncMetadata[]>;
  saveSyncMetadata(metadata: SyncMetadata): Promise<void>;
  
  // Utility operations
  clear(): Promise<void>;
  getStats(): Promise<{
    patients: number;
    orders: number;
    results: number;
    tests: number;
    queueItems: number;
    totalSize: number;
  }>;
  exportData(): Promise<any>;
  importData(data: any): Promise<void>;
}