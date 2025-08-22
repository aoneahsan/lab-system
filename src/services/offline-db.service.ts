import { unifiedStorage } from './unified-storage.service';
import { logger } from '@/services/logger.service';

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

export interface OfflineMetadata {
  lastSyncTime: number;
  pendingChanges: number;
  collections: Record<
    string,
    {
      lastFetch: number;
      recordCount: number;
    }
  >;
}

// Interface for offline database implementations
interface IOfflineDbService {
  initialize(): Promise<void>;
  queueOperation(collection: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void>;
  getPendingOperations(): Promise<OfflineQueueItem[]>;
  markAsSynced(id: string): Promise<void>;
  updateRetryInfo(id: string, error: string): Promise<void>;
  cacheData(collection: string, tenantId: string, data: any[]): Promise<void>;
  getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]>;
  getCachedRecord(collection: string, id: string): Promise<any | null>;
  updateCachedRecord(collection: string, id: string, updates: any): Promise<void>;
  getMetadata(): Promise<OfflineMetadata>;
  updateMetadata(updates: Partial<OfflineMetadata>): Promise<void>;
  clearOfflineData(): Promise<void>;
  close(): Promise<void>;
  isOfflineSupported(): boolean;
}

// Unified implementation using strata-storage
class UnifiedOfflineDbService implements IOfflineDbService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (!this.initPromise) {
      this.initPromise = this.performInitialization();
    }
    
    await this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      await unifiedStorage.initialize();
      
      // Initialize metadata if not exists
      const metadata = await unifiedStorage.get<OfflineMetadata>('offline_metadata');
      if (!metadata) {
        await unifiedStorage.set('offline_metadata', {
          lastSyncTime: 0,
          pendingChanges: 0,
          collections: {}
        }, {
          tags: ['offline-metadata']
        });
      }
      
      this.initialized = true;
      logger.log('Unified offline database service initialized');
    } catch (error) {
      logger.error('Failed to initialize unified offline database:', error);
      throw error;
    }
  }

  async queueOperation(collection: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void> {
    await this.initialize();
    
    const queue = await this.getPendingOperations();
    const newItem: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      collection,
      operation,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };
    
    queue.push(newItem);
    
    await unifiedStorage.set('offline_queue', queue, {
      tags: ['offline-queue'],
      compression: true
    });
    
    // Update pending changes count
    const metadata = await this.getMetadata();
    metadata.pendingChanges = queue.filter(item => !item.synced).length;
    await this.updateMetadata(metadata);
  }

  async getPendingOperations(): Promise<OfflineQueueItem[]> {
    await this.initialize();
    return (await unifiedStorage.get<OfflineQueueItem[]>('offline_queue')) || [];
  }

  async markAsSynced(id: string): Promise<void> {
    await this.initialize();
    
    const queue = await this.getPendingOperations();
    const index = queue.findIndex(item => item.id === id);
    
    if (index >= 0) {
      queue[index].synced = true;
      
      await unifiedStorage.set('offline_queue', queue, {
        tags: ['offline-queue'],
        compression: true
      });
      
      // Update pending changes count
      const metadata = await this.getMetadata();
      metadata.pendingChanges = queue.filter(item => !item.synced).length;
      await this.updateMetadata(metadata);
    }
  }

  async updateRetryInfo(id: string, error: string): Promise<void> {
    await this.initialize();
    
    const queue = await this.getPendingOperations();
    const index = queue.findIndex(item => item.id === id);
    
    if (index >= 0) {
      queue[index].retryCount++;
      queue[index].lastError = error;
      
      await unifiedStorage.set('offline_queue', queue, {
        tags: ['offline-queue'],
        compression: true
      });
    }
  }

  async cacheData(collection: string, tenantId: string, data: any[]): Promise<void> {
    await this.initialize();
    
    const key = `cached_${collection}_${tenantId}`;
    await unifiedStorage.set(key, data, {
      tags: ['offline-cache', collection, tenantId],
      compression: true
    });
    
    // Update metadata
    const metadata = await this.getMetadata();
    if (!metadata.collections[collection]) {
      metadata.collections[collection] = {
        lastFetch: Date.now(),
        recordCount: data.length
      };
    } else {
      metadata.collections[collection].lastFetch = Date.now();
      metadata.collections[collection].recordCount = data.length;
    }
    await this.updateMetadata(metadata);
  }

  async getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]> {
    await this.initialize();
    
    const key = `cached_${collection}_${tenantId}`;
    const data = (await unifiedStorage.get<any[]>(key)) || [];
    
    if (!filters) return data;
    
    // Apply simple filters
    return data.filter(item => {
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (item[filterKey] !== filterValue) return false;
      }
      return true;
    });
  }

  async getCachedRecord(collection: string, id: string): Promise<any | null> {
    await this.initialize();
    
    // Search through all tenant caches
    const keys = await unifiedStorage.keys();
    const cacheKeys = keys.filter(key => key.startsWith(`cached_${collection}_`));
    
    for (const key of cacheKeys) {
      const data = (await unifiedStorage.get<any[]>(key)) || [];
      const record = data.find(item => item.id === id);
      if (record) return record;
    }
    
    return null;
  }

  async updateCachedRecord(collection: string, id: string, updates: any): Promise<void> {
    await this.initialize();
    
    // Search through all tenant caches
    const keys = await unifiedStorage.keys();
    const cacheKeys = keys.filter(key => key.startsWith(`cached_${collection}_`));
    
    for (const key of cacheKeys) {
      const data = (await unifiedStorage.get<any[]>(key)) || [];
      const index = data.findIndex(item => item.id === id);
      
      if (index >= 0) {
        data[index] = { ...data[index], ...updates };
        await unifiedStorage.set(key, data, {
          tags: ['offline-cache', collection, key.split('_')[2]],
          compression: true
        });
        break;
      }
    }
  }

  async getMetadata(): Promise<OfflineMetadata> {
    await this.initialize();
    
    return (await unifiedStorage.get<OfflineMetadata>('offline_metadata')) || {
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {}
    };
  }

  async updateMetadata(updates: Partial<OfflineMetadata>): Promise<void> {
    await this.initialize();
    
    const current = await this.getMetadata();
    const updated = { ...current, ...updates };
    
    await unifiedStorage.set('offline_metadata', updated, {
      tags: ['offline-metadata']
    });
  }

  async clearOfflineData(): Promise<void> {
    await this.initialize();
    
    // Clear all offline-related data
    await unifiedStorage.removeByTag('offline-cache');
    await unifiedStorage.removeByTag('offline-queue');
    await unifiedStorage.removeByTag('offline-metadata');
    
    // Reinitialize metadata
    await unifiedStorage.set('offline_metadata', {
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {}
    }, {
      tags: ['offline-metadata']
    });
  }

  async close(): Promise<void> {
    // No-op for unified storage
  }

  isOfflineSupported(): boolean {
    return true;
  }
}

// Facade class that uses unified implementation
class OfflineDbService implements IOfflineDbService {
  private implementation: IOfflineDbService;

  constructor() {
    // Always use unified implementation now
    this.implementation = new UnifiedOfflineDbService();
  }

  async initialize(): Promise<void> {
    return this.implementation.initialize();
  }

  async queueOperation(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    return this.implementation.queueOperation(collection, operation, data);
  }

  async getPendingOperations(): Promise<OfflineQueueItem[]> {
    return this.implementation.getPendingOperations();
  }

  async markAsSynced(id: string): Promise<void> {
    return this.implementation.markAsSynced(id);
  }

  async updateRetryInfo(id: string, error: string): Promise<void> {
    return this.implementation.updateRetryInfo(id, error);
  }

  async cacheData(collection: string, tenantId: string, data: any[]): Promise<void> {
    return this.implementation.cacheData(collection, tenantId, data);
  }

  async getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]> {
    return this.implementation.getCachedData(collection, tenantId, filters);
  }

  async getCachedRecord(collection: string, id: string): Promise<any | null> {
    return this.implementation.getCachedRecord(collection, id);
  }

  async updateCachedRecord(collection: string, id: string, updates: any): Promise<void> {
    return this.implementation.updateCachedRecord(collection, id, updates);
  }

  async getMetadata(): Promise<OfflineMetadata> {
    return this.implementation.getMetadata();
  }

  async updateMetadata(updates: Partial<OfflineMetadata>): Promise<void> {
    return this.implementation.updateMetadata(updates);
  }

  async clearOfflineData(): Promise<void> {
    return this.implementation.clearOfflineData();
  }

  async close(): Promise<void> {
    return this.implementation.close();
  }

  isOfflineSupported(): boolean {
    return this.implementation.isOfflineSupported();
  }
}

export const offlineDbService = new OfflineDbService();