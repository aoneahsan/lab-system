import { unifiedStorage, STORAGE_KEYS } from './unified-storage.service';
import type {
  OfflineDatabase,
  OfflinePatient,
  OfflineOrder,
  OfflineResult,
  OfflineTest,
  OfflineQueueItem,
  SyncMetadata
} from '@/types/offline';

/**
 * Unified offline database implementation using strata-storage
 * Works across all platforms (web, iOS, Android) with a single API
 */
export class UnifiedOfflineDatabase implements OfflineDatabase {
  private dbName = 'labflow_offline';
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
      // Initialize unified storage (if not already initialized)
      await unifiedStorage.initialize();
      
      // Create collections if they don't exist
      await this.ensureCollections();
      
      this.initialized = true;
      console.log('Unified offline database initialized');
    } catch (error) {
      console.error('Failed to initialize unified offline database:', error);
      throw error;
    }
  }

  private async ensureCollections(): Promise<void> {
    // Check if collections exist, if not create with empty arrays
    const collections = [
      STORAGE_KEYS.DB_PATIENTS,
      STORAGE_KEYS.DB_ORDERS,
      STORAGE_KEYS.DB_RESULTS,
      STORAGE_KEYS.DB_TESTS,
      STORAGE_KEYS.DB_OFFLINE_QUEUE,
      STORAGE_KEYS.DB_SYNC_METADATA
    ];

    for (const collection of collections) {
      const exists = await unifiedStorage.has(collection);
      if (!exists) {
        await unifiedStorage.set(collection, [], {
          tags: ['offline-db', 'collection'],
          compression: true
        });
      }
    }
  }

  // Patient operations
  async getPatients(): Promise<OfflinePatient[]> {
    await this.initialize();
    return (await unifiedStorage.get<OfflinePatient[]>(STORAGE_KEYS.DB_PATIENTS)) || [];
  }

  async getPatient(id: string): Promise<OfflinePatient | undefined> {
    const patients = await this.getPatients();
    return patients.find(p => p.id === id);
  }

  async savePatient(patient: OfflinePatient): Promise<void> {
    await this.initialize();
    const patients = await this.getPatients();
    const index = patients.findIndex(p => p.id === patient.id);
    
    if (index >= 0) {
      patients[index] = { ...patients[index], ...patient, lastModified: Date.now() };
    } else {
      patients.push({ ...patient, lastModified: Date.now() });
    }
    
    await unifiedStorage.set(STORAGE_KEYS.DB_PATIENTS, patients, {
      tags: ['offline-db', 'collection', 'patients'],
      compression: true
    });
  }

  async deletePatient(id: string): Promise<void> {
    await this.initialize();
    const patients = await this.getPatients();
    const filtered = patients.filter(p => p.id !== id);
    
    await unifiedStorage.set(STORAGE_KEYS.DB_PATIENTS, filtered, {
      tags: ['offline-db', 'collection', 'patients'],
      compression: true
    });
  }

  // Order operations
  async getOrders(): Promise<OfflineOrder[]> {
    await this.initialize();
    return (await unifiedStorage.get<OfflineOrder[]>(STORAGE_KEYS.DB_ORDERS)) || [];
  }

  async getOrder(id: string): Promise<OfflineOrder | undefined> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id);
  }

  async saveOrder(order: OfflineOrder): Promise<void> {
    await this.initialize();
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    
    if (index >= 0) {
      orders[index] = { ...orders[index], ...order, lastModified: Date.now() };
    } else {
      orders.push({ ...order, lastModified: Date.now() });
    }
    
    await unifiedStorage.set(STORAGE_KEYS.DB_ORDERS, orders, {
      tags: ['offline-db', 'collection', 'orders'],
      compression: true
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await this.initialize();
    const orders = await this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    
    await unifiedStorage.set(STORAGE_KEYS.DB_ORDERS, filtered, {
      tags: ['offline-db', 'collection', 'orders'],
      compression: true
    });
  }

  // Result operations
  async getResults(): Promise<OfflineResult[]> {
    await this.initialize();
    return (await unifiedStorage.get<OfflineResult[]>(STORAGE_KEYS.DB_RESULTS)) || [];
  }

  async getResult(id: string): Promise<OfflineResult | undefined> {
    const results = await this.getResults();
    return results.find(r => r.id === id);
  }

  async saveResult(result: OfflineResult): Promise<void> {
    await this.initialize();
    const results = await this.getResults();
    const index = results.findIndex(r => r.id === result.id);
    
    if (index >= 0) {
      results[index] = { ...results[index], ...result, lastModified: Date.now() };
    } else {
      results.push({ ...result, lastModified: Date.now() });
    }
    
    await unifiedStorage.set(STORAGE_KEYS.DB_RESULTS, results, {
      tags: ['offline-db', 'collection', 'results'],
      compression: true
    });
  }

  async deleteResult(id: string): Promise<void> {
    await this.initialize();
    const results = await this.getResults();
    const filtered = results.filter(r => r.id !== id);
    
    await unifiedStorage.set(STORAGE_KEYS.DB_RESULTS, filtered, {
      tags: ['offline-db', 'collection', 'results'],
      compression: true
    });
  }

  // Test operations
  async getTests(): Promise<OfflineTest[]> {
    await this.initialize();
    return (await unifiedStorage.get<OfflineTest[]>(STORAGE_KEYS.DB_TESTS)) || [];
  }

  async getTest(id: string): Promise<OfflineTest | undefined> {
    const tests = await this.getTests();
    return tests.find(t => t.id === id);
  }

  async saveTest(test: OfflineTest): Promise<void> {
    await this.initialize();
    const tests = await this.getTests();
    const index = tests.findIndex(t => t.id === test.id);
    
    if (index >= 0) {
      tests[index] = { ...tests[index], ...test };
    } else {
      tests.push(test);
    }
    
    await unifiedStorage.set(STORAGE_KEYS.DB_TESTS, tests, {
      tags: ['offline-db', 'collection', 'tests'],
      compression: true
    });
  }

  async deleteTest(id: string): Promise<void> {
    await this.initialize();
    const tests = await this.getTests();
    const filtered = tests.filter(t => t.id !== id);
    
    await unifiedStorage.set(STORAGE_KEYS.DB_TESTS, filtered, {
      tags: ['offline-db', 'collection', 'tests'],
      compression: true
    });
  }

  // Offline queue operations
  async getQueueItems(): Promise<OfflineQueueItem[]> {
    await this.initialize();
    return (await unifiedStorage.get<OfflineQueueItem[]>(STORAGE_KEYS.DB_OFFLINE_QUEUE)) || [];
  }

  async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    await this.initialize();
    const queue = await this.getQueueItems();
    
    const newItem: OfflineQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    queue.push(newItem);
    
    await unifiedStorage.set(STORAGE_KEYS.DB_OFFLINE_QUEUE, queue, {
      tags: ['offline-db', 'collection', 'queue'],
      compression: true
    });
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.initialize();
    const queue = await this.getQueueItems();
    const filtered = queue.filter(item => item.id !== id);
    
    await unifiedStorage.set(STORAGE_KEYS.DB_OFFLINE_QUEUE, filtered, {
      tags: ['offline-db', 'collection', 'queue'],
      compression: true
    });
  }

  async updateQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    await this.initialize();
    const queue = await this.getQueueItems();
    const index = queue.findIndex(item => item.id === id);
    
    if (index >= 0) {
      queue[index] = { ...queue[index], ...updates };
      
      await unifiedStorage.set(STORAGE_KEYS.DB_OFFLINE_QUEUE, queue, {
        tags: ['offline-db', 'collection', 'queue'],
        compression: true
      });
    }
  }

  // Sync metadata operations
  async getSyncMetadata(): Promise<SyncMetadata[]> {
    await this.initialize();
    return (await unifiedStorage.get<SyncMetadata[]>(STORAGE_KEYS.DB_SYNC_METADATA)) || [];
  }

  async saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
    await this.initialize();
    const allMetadata = await this.getSyncMetadata();
    const index = allMetadata.findIndex(m => m.collection === metadata.collection);
    
    if (index >= 0) {
      allMetadata[index] = metadata;
    } else {
      allMetadata.push(metadata);
    }
    
    await unifiedStorage.set(STORAGE_KEYS.DB_SYNC_METADATA, allMetadata, {
      tags: ['offline-db', 'collection', 'metadata'],
      compression: true
    });
  }

  // Utility operations
  async clear(): Promise<void> {
    await this.initialize();
    
    // Clear all offline database collections
    await unifiedStorage.removeByTag('offline-db');
    
    // Recreate empty collections
    await this.ensureCollections();
  }

  async getStats(): Promise<{
    patients: number;
    orders: number;
    results: number;
    tests: number;
    queueItems: number;
    totalSize: number;
  }> {
    await this.initialize();
    
    const [patients, orders, results, tests, queueItems] = await Promise.all([
      this.getPatients(),
      this.getOrders(),
      this.getResults(),
      this.getTests(),
      this.getQueueItems()
    ]);

    const stats = await unifiedStorage.getStats();

    return {
      patients: patients.length,
      orders: orders.length,
      results: results.length,
      tests: tests.length,
      queueItems: queueItems.length,
      totalSize: stats.totalSize
    };
  }

  async exportData(): Promise<any> {
    await this.initialize();
    
    const [patients, orders, results, tests, queueItems, syncMetadata] = await Promise.all([
      this.getPatients(),
      this.getOrders(),
      this.getResults(),
      this.getTests(),
      this.getQueueItems(),
      this.getSyncMetadata()
    ]);

    return {
      patients,
      orders,
      results,
      tests,
      queueItems,
      syncMetadata,
      exportDate: new Date().toISOString()
    };
  }

  async importData(data: any): Promise<void> {
    await this.initialize();
    
    if (data.patients) {
      await unifiedStorage.set(STORAGE_KEYS.DB_PATIENTS, data.patients, {
        tags: ['offline-db', 'collection', 'patients'],
        compression: true
      });
    }
    
    if (data.orders) {
      await unifiedStorage.set(STORAGE_KEYS.DB_ORDERS, data.orders, {
        tags: ['offline-db', 'collection', 'orders'],
        compression: true
      });
    }
    
    if (data.results) {
      await unifiedStorage.set(STORAGE_KEYS.DB_RESULTS, data.results, {
        tags: ['offline-db', 'collection', 'results'],
        compression: true
      });
    }
    
    if (data.tests) {
      await unifiedStorage.set(STORAGE_KEYS.DB_TESTS, data.tests, {
        tags: ['offline-db', 'collection', 'tests'],
        compression: true
      });
    }
    
    if (data.queueItems) {
      await unifiedStorage.set(STORAGE_KEYS.DB_OFFLINE_QUEUE, data.queueItems, {
        tags: ['offline-db', 'collection', 'queue'],
        compression: true
      });
    }
    
    if (data.syncMetadata) {
      await unifiedStorage.set(STORAGE_KEYS.DB_SYNC_METADATA, data.syncMetadata, {
        tags: ['offline-db', 'collection', 'metadata'],
        compression: true
      });
    }
  }
}

// Create singleton instance
export const unifiedOfflineDb = new UnifiedOfflineDatabase();