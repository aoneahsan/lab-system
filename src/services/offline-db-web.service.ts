import Dexie, { Table } from 'dexie';
import type { OfflineQueueItem, OfflineMetadata } from './offline-db.service';

// Define interfaces for our IndexedDB tables
interface QueueRecord {
  id?: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

interface MetadataRecord {
  key: string;
  value: any;
}

interface CachedRecord {
  id?: string;
  tenantId: string;
  data: any;
  lastUpdated: number;
  patientId?: string;
  orderId?: string;
}

// Create Dexie database class
class LabFlowDatabase extends Dexie {
  offlineQueue!: Table<QueueRecord>;
  offlineMetadata!: Table<MetadataRecord>;
  cachedPatients!: Table<CachedRecord>;
  cachedOrders!: Table<CachedRecord>;
  cachedResults!: Table<CachedRecord>;
  cachedTests!: Table<CachedRecord>;

  constructor() {
    super('labflow_offline');

    // Define database schema
    this.version(1).stores({
      offlineQueue: 'id, collection, synced, timestamp',
      offlineMetadata: 'key',
      cachedPatients: 'id, tenantId, lastUpdated',
      cachedOrders: 'id, tenantId, patientId, lastUpdated',
      cachedResults: 'id, tenantId, orderId, patientId, lastUpdated',
      cachedTests: 'id, tenantId, lastUpdated',
    });
  }
}

// Web implementation of offline database service
export class OfflineDbWebService {
  private db: LabFlowDatabase;
  private isInitialized = false;

  constructor() {
    this.db = new LabFlowDatabase();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.db.open();
      this.isInitialized = true;
      console.log('IndexedDB offline database initialized');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  // Queue operations for sync
  async queueOperation(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.offlineQueue.add({
      id,
      collection,
      operation,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    });

    await this.updatePendingCount();
  }

  // Get pending operations
  async getPendingOperations(): Promise<OfflineQueueItem[]> {
    const records = await this.db.offlineQueue
      .where('synced')
      .equals(false)
      .sortBy('timestamp');

    return records.map((record) => ({
      id: record.id!,
      collection: record.collection,
      operation: record.operation,
      data: record.data,
      timestamp: record.timestamp,
      synced: record.synced,
      retryCount: record.retryCount,
      lastError: record.lastError,
    }));
  }

  // Mark operation as synced
  async markAsSynced(id: string): Promise<void> {
    await this.db.offlineQueue.update(id, { synced: true });
    await this.updatePendingCount();
  }

  // Update retry count and error
  async updateRetryInfo(id: string, error: string): Promise<void> {
    const record = await this.db.offlineQueue.get(id);
    if (record) {
      await this.db.offlineQueue.update(id, {
        retryCount: record.retryCount + 1,
        lastError: error,
      });
    }
  }

  // Cache data locally
  async cacheData(collection: string, tenantId: string, data: any[]): Promise<void> {
    const table = this.getTable(collection);
    if (!table) return;

    // Clear existing data for tenant
    await table.where('tenantId').equals(tenantId).delete();

    // Insert new data
    const records = data.map((item) => {
      const record: CachedRecord = {
        id: item.id,
        tenantId,
        data: item,
        lastUpdated: Date.now(),
      };

      // Add additional fields based on collection
      if (collection === 'labflow_orders' && item.patientId) {
        record.patientId = item.patientId;
      } else if (collection === 'labflow_results') {
        record.orderId = item.orderId || null;
        record.patientId = item.patientId || null;
      }

      return record;
    });

    await table.bulkAdd(records);
    await this.updateCollectionMetadata(collection, data.length);
  }

  // Get cached data
  async getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]> {
    const table = this.getTable(collection);
    if (!table) return [];

    let query = table.where('tenantId').equals(tenantId);

    // Apply filters if provided
    const records = await query.toArray();
    
    // Filter in memory for complex queries
    let filteredRecords = records;
    if (filters) {
      filteredRecords = records.filter((record) => {
        if (filters.patientId && record.patientId !== filters.patientId) return false;
        if (filters.orderId && record.orderId !== filters.orderId) return false;
        return true;
      });
    }

    // Sort by lastUpdated descending
    filteredRecords.sort((a, b) => b.lastUpdated - a.lastUpdated);

    return filteredRecords.map((record) => record.data);
  }

  // Get specific cached record
  async getCachedRecord(collection: string, id: string): Promise<any | null> {
    const table = this.getTable(collection);
    if (!table) return null;

    const record = await table.get(id);
    return record ? record.data : null;
  }

  // Update cached record
  async updateCachedRecord(collection: string, id: string, updates: any): Promise<void> {
    const table = this.getTable(collection);
    if (!table) return;

    const existingRecord = await table.get(id);
    if (!existingRecord) return;

    // Merge updates
    const updatedData = { ...existingRecord.data, ...updates };

    await table.update(id, {
      data: updatedData,
      lastUpdated: Date.now(),
    });
  }

  // Get offline metadata
  async getMetadata(): Promise<OfflineMetadata> {
    const metadataRecord = await this.db.offlineMetadata.get('metadata');
    
    if (metadataRecord && metadataRecord.value) {
      return metadataRecord.value;
    }

    return {
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {},
    };
  }

  // Update metadata
  async updateMetadata(updates: Partial<OfflineMetadata>): Promise<void> {
    const current = await this.getMetadata();
    const updated = { ...current, ...updates };

    await this.db.offlineMetadata.put({
      key: 'metadata',
      value: updated,
    });
  }

  // Update pending count
  private async updatePendingCount(): Promise<void> {
    const count = await this.db.offlineQueue.where('synced').equals(false).count();
    await this.updateMetadata({ pendingChanges: count });
  }

  // Update collection metadata
  private async updateCollectionMetadata(collection: string, recordCount: number): Promise<void> {
    const metadata = await this.getMetadata();

    metadata.collections[collection] = {
      lastFetch: Date.now(),
      recordCount,
    };

    await this.updateMetadata({ collections: metadata.collections });
  }

  // Get table for collection
  private getTable(collection: string): Table<CachedRecord> | null {
    const mapping: Record<string, Table<CachedRecord>> = {
      labflow_patients: this.db.cachedPatients,
      labflow_orders: this.db.cachedOrders,
      labflow_results: this.db.cachedResults,
      labflow_tests: this.db.cachedTests,
    };

    return mapping[collection] || null;
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    await this.db.offlineQueue.clear();
    await this.db.cachedPatients.clear();
    await this.db.cachedOrders.clear();
    await this.db.cachedResults.clear();
    await this.db.cachedTests.clear();

    await this.updateMetadata({
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {},
    });
  }

  // Close database connection
  async close(): Promise<void> {
    this.db.close();
    this.isInitialized = false;
  }

  // Check if offline mode is supported (always true for web)
  isOfflineSupported(): boolean {
    return true;
  }
}