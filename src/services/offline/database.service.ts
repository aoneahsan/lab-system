import { Strata } from 'strata-storage';
import { Capacitor } from '@capacitor/core';

export interface OfflineRecord {
  id: string;
  collection: string;
  documentId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  syncError?: string;
}

class OfflineDatabaseService {
  private storage: Strata;
  private readonly platform = Capacitor.getPlatform();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    const isNative = Capacitor.isNativePlatform();
    
    this.storage = new Strata({
      defaultStorages: isNative
        ? ['sqlite', 'preferences', 'secure-storage', 'filesystem', 'memory']
        : ['indexedDB', 'localStorage', 'sessionStorage', 'cache', 'memory'],
      encryption: {
        enabled: true,
        password: 'labflow-offline-db-2024'
      },
      compression: {
        enabled: true,
        threshold: 1024
      },
      sync: {
        enabled: true
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (!this.initPromise) {
      this.initPromise = this.performInitialization();
    }
    
    await this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      await this.storage.initialize();
      await this.setupInitialData();
      this.isInitialized = true;

      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Error initializing offline database:', error);
      throw error;
    }
  }

  private async setupInitialData(): Promise<void> {
    // Initialize sync metadata structure if not exists
    const syncMetadata = await this.storage.get('sync_metadata');
    if (!syncMetadata) {
      await this.storage.set('sync_metadata', {}, {
        tags: ['sync_metadata']
      });
    }
  }

  async queueOperation(
    operation: Omit<OfflineRecord, 'id' | 'timestamp' | 'synced'>
  ): Promise<void> {
    await this.initialize();

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const record: OfflineRecord = {
      id,
      collection: operation.collection,
      documentId: operation.documentId,
      operation: operation.operation,
      data: operation.data,
      timestamp,
      synced: false,
      syncError: operation.syncError
    };

    await this.storage.set(`offline_queue_${id}`, record, {
      tags: ['offline_queue', `collection_${operation.collection}`]
    });
  }

  async getUnsynced(): Promise<OfflineRecord[]> {
    await this.initialize();

    const items = await this.storage.query<OfflineRecord>({
      synced: false
    });

    // Filter offline queue items and sort by timestamp
    const queueItems = items
      .filter(item => item.key.startsWith('offline_queue_'))
      .map(item => item.value)
      .sort((a, b) => a.timestamp - b.timestamp);

    return queueItems;
  }

  async markSynced(id: string): Promise<void> {
    await this.initialize();

    const record = await this.storage.get<OfflineRecord>(`offline_queue_${id}`);
    if (record) {
      record.synced = true;
      await this.storage.set(`offline_queue_${id}`, record, {
        tags: ['offline_queue', `collection_${record.collection}`]
      });
    }
  }

  async markSyncError(id: string, error: string): Promise<void> {
    await this.initialize();

    const record = await this.storage.get<OfflineRecord>(`offline_queue_${id}`);
    if (record) {
      record.syncError = error;
      await this.storage.set(`offline_queue_${id}`, record, {
        tags: ['offline_queue', `collection_${record.collection}`]
      });
    }
  }

  // Cache management methods
  async cacheData(
    collection: string,
    id: string,
    data: any,
    additionalFields?: Record<string, any>
  ): Promise<void> {
    await this.initialize();

    const timestamp = Date.now();
    const cacheKey = `cached_${collection}_${id}`;

    const cacheData = {
      id,
      data,
      lastSynced: timestamp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...additionalFields
    };

    await this.storage.set(cacheKey, cacheData, {
      tags: [`cached_${collection}`, 'cached_data']
    });
  }

  async getCachedData(collection: string, id?: string): Promise<any[]> {
    await this.initialize();

    if (id) {
      const item = await this.storage.get<{ id: string; data: any; lastSynced: number }>(`cached_${collection}_${id}`);
      return item ? [{ id: item.id, ...item.data, _lastSynced: item.lastSynced }] : [];
    }

    // Get all items for collection
    const items = await this.storage.query<{ id: string; data: any; lastSynced: number }>({});
    const collectionItems = items
      .filter(item => item.key.startsWith(`cached_${collection}_`))
      .map(item => ({
        id: item.value.id,
        ...item.value.data,
        _lastSynced: item.value.lastSynced
      }));

    return collectionItems;
  }

  async getCachedDataByPatient(collection: string, patientId: string): Promise<any[]> {
    await this.initialize();

    const items = await this.storage.query<{ id: string; data: any; lastSynced: number }>({
      patientId: patientId
    });

    const filteredItems = items
      .filter(item => item.key.startsWith(`cached_${collection}_`))
      .map(item => ({
        id: item.value.id,
        ...item.value.data,
        _lastSynced: item.value.lastSynced
      }));

    return filteredItems;
  }

  async clearCache(collection?: string): Promise<void> {
    await this.initialize();

    if (collection) {
      // Clear specific collection
      const items = await this.storage.query({});
      for (const item of items) {
        if (item.key.startsWith(`cached_${collection}_`)) {
          await this.storage.remove(item.key);
        }
      }
    } else {
      // Clear all cache tables
      const tables = ['patients', 'samples', 'results', 'appointments'];
      for (const table of tables) {
        const items = await this.storage.query({});
        for (const item of items) {
          if (item.key.startsWith(`cached_${table}_`)) {
            await this.storage.remove(item.key);
          }
        }
      }
    }
  }

  async getSyncMetadata(collection: string): Promise<any> {
    await this.initialize();

    const metadata = await this.storage.get<any>('sync_metadata');
    return metadata?.[collection] || null;
  }

  async updateSyncMetadata(collection: string, status: string, error?: string): Promise<void> {
    await this.initialize();

    const metadata = await this.storage.get<any>('sync_metadata') || {};
    
    metadata[collection] = {
      collection,
      lastSyncTimestamp: Date.now(),
      syncStatus: status,
      syncError: error || null,
      updatedAt: new Date().toISOString()
    };

    await this.storage.set('sync_metadata', metadata, {
      tags: ['sync_metadata']
    });
  }

  async close(): Promise<void> {
    // Strata handles connection management automatically
    this.isInitialized = false;
  }

  isAvailable(): boolean {
    // Strata works on all platforms
    return this.isInitialized;
  }
}

export const offlineDatabase = new OfflineDatabaseService();
