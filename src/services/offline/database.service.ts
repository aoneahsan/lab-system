// Offline database service using IndexedDB
class OfflineDatabaseService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'labflow_offline';
  private readonly version = 1;
  private readonly collections = ['patients', 'tests', 'samples', 'results', 'operations', 'sync_metadata'];

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each collection
        this.collections.forEach(collection => {
          if (!db.objectStoreNames.contains(collection)) {
            const store = db.createObjectStore(collection, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
          }
        });
      };
    });
  }

  async getCachedData(collection: string): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async cacheData(collection: string, id: string, data: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.put({
        ...data,
        id,
        timestamp: Date.now(),
        syncStatus: 'cached'
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateDocument(collection: string, id: string, data: any, metadata?: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.put({
        ...data,
        id,
        timestamp: Date.now(),
        syncStatus: metadata?.synced ? 'synced' : 'pending',
        ...metadata
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getDocuments(collection: string): Promise<any[]> {
    return this.getCachedData(collection);
  }

  async clearCollection(collection: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getQueuedOperations(): Promise<any[]> {
    return this.getCachedData('operations');
  }

  async queueOperation(operation: any): Promise<void> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.cacheData('operations', operationId, {
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    });
  }

  async removeQueuedOperation(id: string): Promise<void> {
    return this.deleteDocument('operations', id);
  }

  async getCollections(): Promise<string[]> {
    return this.collections.filter(c => c !== 'operations' && c !== 'sync_metadata');
  }

  async getLastSyncTime(collection: string): Promise<number | null> {
    const metadata = await this.getSyncMetadata(collection);
    return metadata.lastSyncTime || null;
  }

  async setLastSyncTime(collection: string, timestamp: number): Promise<void> {
    return this.updateSyncMetadata(collection, { lastSyncTime: timestamp });
  }

  async clearAllData(): Promise<void> {
    const collections = await this.getCollections();
    await Promise.all(collections.map(c => this.clearCollection(c)));
    await this.clearCollection('operations');
    await this.clearCollection('sync_metadata');
  }

  async getUnsynced(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    const collections = await this.getCollections();
    const unsynced: any[] = [];
    
    for (const collection of collections) {
      const items = await this.getCachedData(collection);
      unsynced.push(...items.filter(item => item.syncStatus === 'pending'));
    }
    
    return unsynced;
  }

  async markSynced(id: string): Promise<void> {
    // Find and update the item in all collections
    const collections = await this.getCollections();
    
    for (const collection of collections) {
      try {
        const items = await this.getCachedData(collection);
        const item = items.find(i => i.id === id);
        if (item) {
          await this.updateDocument(collection, id, item, { syncStatus: 'synced' });
          return;
        }
      } catch (error) {
        // Continue searching in other collections
      }
    }
  }

  async markSyncError(id: string, error: any): Promise<void> {
    // Find and update the item in all collections
    const collections = await this.getCollections();
    
    for (const collection of collections) {
      try {
        const items = await this.getCachedData(collection);
        const item = items.find(i => i.id === id);
        if (item) {
          await this.updateDocument(collection, id, item, { 
            syncStatus: 'error',
            syncError: error,
            lastSyncAttempt: Date.now()
          });
          return;
        }
      } catch (error) {
        // Continue searching in other collections
      }
    }
  }

  async updateSyncMetadata(collection: string, metadata: any): Promise<void> {
    return this.updateDocument('sync_metadata', collection, metadata);
  }

  async getSyncMetadata(collection?: string): Promise<any> {
    if (collection) {
      const allMetadata = await this.getCachedData('sync_metadata');
      return allMetadata.find(m => m.id === collection) || {};
    }
    return this.getCachedData('sync_metadata');
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const offlineDatabase = new OfflineDatabaseService();