import { Strata } from 'strata-storage';
import { COLLECTIONS } from '@/config/firebase-collections';
import type { OfflineQueueItem, OfflineMetadata } from './offline-db.service';

// Native implementation using strata-storage
export class OfflineDbNativeService {
  private storage: Strata;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.storage = new Strata({
      defaultStorages: ['sqlite', 'preferences', 'secure-storage', 'filesystem', 'memory'],
      encryption: {
        enabled: true,
        password: 'labflow-offline-encryption-2024'
      },
      compression: {
        enabled: true,
        threshold: 1024
      },
      sync: {
        enabled: false // Disable sync for offline database
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
      await this.setupCollections();
      this.isInitialized = true;
      console.log('Strata offline database initialized');
    } catch (error) {
      console.error('Failed to initialize Strata database:', error);
      throw error;
    }
  }

  private async setupCollections(): Promise<void> {
    // Initialize metadata if not exists
    const metadata = await this.storage.get<OfflineMetadata>('offline_metadata');
    if (!metadata) {
      await this.storage.set('offline_metadata', {
        lastSyncTime: 0,
        pendingChanges: 0,
        collections: {}
      });
    }
  }

  // Queue operations for sync
  async queueOperation(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    await this.initialize();

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem: OfflineQueueItem = {
      id,
      collection,
      operation,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    await this.storage.set(`offline_queue_${id}`, queueItem, {
      tags: ['offline_queue']
    });

    await this.updatePendingCount();
  }

  // Get pending operations
  async getPendingOperations(): Promise<OfflineQueueItem[]> {
    await this.initialize();

    const queueItems = await this.storage.query<OfflineQueueItem>({
      synced: false
    });

    // Sort by timestamp
    const sortedItems = queueItems
      .map(item => item.value)
      .sort((a, b) => a.timestamp - b.timestamp);

    return sortedItems;
  }

  // Mark operation as synced
  async markAsSynced(id: string): Promise<void> {
    await this.initialize();

    const item = await this.storage.get<OfflineQueueItem>(`offline_queue_${id}`);
    if (item) {
      item.synced = true;
      await this.storage.set(`offline_queue_${id}`, item, {
        tags: ['offline_queue']
      });
    }
    await this.updatePendingCount();
  }

  // Update retry count and error
  async updateRetryInfo(id: string, error: string): Promise<void> {
    await this.initialize();

    const item = await this.storage.get<OfflineQueueItem>(`offline_queue_${id}`);
    if (item) {
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastError = error;
      await this.storage.set(`offline_queue_${id}`, item, {
        tags: ['offline_queue']
      });
    }
  }

  // Cache data locally
  async cacheData(collection: string, tenantId: string, data: any[]): Promise<void> {
    await this.initialize();

    const collectionKey = this.getCollectionKey(collection);
    if (!collectionKey) return;

    // Clear existing data for tenant
    const existingItems = await this.storage.query({
      tenantId: tenantId
    });
    
    for (const item of existingItems) {
      if (item.key.startsWith(`${collectionKey}_`)) {
        await this.storage.remove(item.key);
      }
    }

    // Insert new data
    for (const item of data) {
      const key = `${collectionKey}_${item.id}`;
      const cacheItem = {
        ...item,
        tenantId,
        lastUpdated: Date.now()
      };

      await this.storage.set(key, cacheItem, {
        tags: [collectionKey, `tenant_${tenantId}`]
      });
    }

    await this.updateCollectionMetadata(collection, data.length);
  }

  // Get cached data
  async getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]> {
    await this.initialize();

    const collectionKey = this.getCollectionKey(collection);
    if (!collectionKey) return [];

    // Build query
    const query: any = {
      tenantId: tenantId
    };

    // Add filters
    if (filters) {
      if (filters.patientId) {
        query.patientId = filters.patientId;
      }
      if (filters.orderId) {
        query.orderId = filters.orderId;
      }
    }

    const items = await this.storage.query(query);
    
    // Filter by collection and sort by lastUpdated
    const filteredItems = items
      .filter(item => item.key.startsWith(`${collectionKey}_`))
      .map(item => item.value)
      .sort((a: any, b: any) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

    return filteredItems;
  }

  // Get specific cached record
  async getCachedRecord(collection: string, id: string): Promise<any | null> {
    await this.initialize();

    const collectionKey = this.getCollectionKey(collection);
    if (!collectionKey) return null;

    const key = `${collectionKey}_${id}`;
    const item = await this.storage.get(key);

    return item || null;
  }

  // Update cached record
  async updateCachedRecord(collection: string, id: string, updates: any): Promise<void> {
    await this.initialize();

    const collectionKey = this.getCollectionKey(collection);
    if (!collectionKey) return;

    // Get existing record
    const existingRecord = await this.getCachedRecord(collection, id);
    if (!existingRecord) return;

    // Merge updates
    const updatedRecord = { 
      ...existingRecord, 
      ...updates,
      lastUpdated: Date.now()
    };

    const key = `${collectionKey}_${id}`;
    await this.storage.set(key, updatedRecord, {
      tags: [collectionKey, `tenant_${updatedRecord.tenantId}`]
    });
  }

  // Get offline metadata
  async getMetadata(): Promise<OfflineMetadata> {
    await this.initialize();

    const metadata = await this.storage.get<OfflineMetadata>('offline_metadata');
    
    return metadata || {
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {},
    };
  }

  // Update metadata
  async updateMetadata(updates: Partial<OfflineMetadata>): Promise<void> {
    await this.initialize();

    const current = await this.getMetadata();
    const updated = { ...current, ...updates };

    await this.storage.set('offline_metadata', updated);
  }

  // Update pending count
  private async updatePendingCount(): Promise<void> {
    await this.initialize();

    const pendingItems = await this.storage.query<OfflineQueueItem>({
      synced: false
    });

    const count = pendingItems.filter(item => 
      item.key.startsWith('offline_queue_')
    ).length;
    
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

  // Get collection key for storage
  private getCollectionKey(collection: string): string | null {
    const mapping: Record<string, string> = {
      [COLLECTIONS.PATIENTS]: 'cached_patients',
      [COLLECTIONS.ORDERS]: 'cached_orders',
      [COLLECTIONS.RESULTS]: 'cached_results',
      [COLLECTIONS.TESTS]: 'cached_tests',
    };

    return mapping[collection] || null;
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    await this.initialize();

    // Clear all offline queue items
    const queueItems = await this.storage.query({});
    for (const item of queueItems) {
      if (item.key.startsWith('offline_queue_')) {
        await this.storage.remove(item.key);
      }
    }

    // Clear all cached collections
    const collectionPrefixes = [
      'cached_patients',
      'cached_orders',
      'cached_results',
      'cached_tests',
    ];

    for (const prefix of collectionPrefixes) {
      const items = await this.storage.query({});
      for (const item of items) {
        if (item.key.startsWith(`${prefix}_`)) {
          await this.storage.remove(item.key);
        }
      }
    }

    await this.updateMetadata({
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {},
    });
  }

  // Close database connection
  async close(): Promise<void> {
    // Strata handles connection management automatically
    this.isInitialized = false;
  }

  // Check if offline mode is supported
  isOfflineSupported(): boolean {
    return true;
  }
}