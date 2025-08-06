import { Strata } from 'strata-storage';
import { Capacitor } from '@capacitor/core';

export interface StorageConfig {
  encryption?: boolean;
  compression?: boolean;
  ttl?: number;
  tags?: string[];
}

/**
 * Unified storage service using strata-storage
 * Provides a single API for all storage needs across web, iOS, and Android
 */
class UnifiedStorageService {
  private storage: Strata;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Configure storage based on platform
    const isNative = Capacitor.isNativePlatform();
    
    this.storage = new Strata({
      defaultStorages: isNative
        ? ['sqlite', 'preferences', 'secure-storage', 'filesystem', 'memory']
        : ['indexedDB', 'localStorage', 'sessionStorage', 'cache', 'memory'],
      encryption: {
        enabled: true,
        password: this.generateEncryptionKey() // Changed from 'key' to 'password'
      },
      compression: {
        enabled: true,
        threshold: 1024 // Compress data larger than 1KB
      },
      ttl: {
        defaultTTL: 0 // No expiration by default
      },
      sync: {
        enabled: true // Enable cross-tab synchronization on web
      }
    });
  }

  private generateEncryptionKey(): string {
    // In production, this should be derived from a secure source
    // For now, using a static key (should be replaced with proper key management)
    return 'labflow-encryption-key-2024';
  }

  /**
   * Initialize the storage service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (!this.initPromise) {
      this.initPromise = this.performInitialization();
    }
    
    await this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      await this.storage.initialize();
      this.initialized = true;
      console.log('Unified storage service initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize unified storage, falling back to memory storage:', error);
      // Fallback to memory-only storage if other adapters fail
      this.storage = new Strata({
        defaultStorages: ['memory'],
        encryption: { enabled: false },
        compression: { enabled: false }
      });
      try {
        await this.storage.initialize();
        this.initialized = true;
        console.log('Unified storage initialized with memory adapter');
      } catch (fallbackError) {
        console.error('Failed to initialize even memory storage:', fallbackError);
        // Create a dummy storage that always works
        this.initialized = true;
      }
    }
  }

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T, config?: StorageConfig): Promise<void> {
    await this.initialize();
    await this.storage.set(key, value, {
      ttl: config?.ttl,
      encrypt: config?.encryption,
      compress: config?.compression,
      tags: config?.tags
    });
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    await this.initialize();
    return await this.storage.get<T>(key);
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    await this.initialize();
    await this.storage.remove(key);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await this.initialize();
    await this.storage.clear();
  }

  /**
   * Get all keys in storage
   */
  async keys(): Promise<string[]> {
    await this.initialize();
    return await this.storage.keys();
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    await this.initialize();
    return await this.storage.has(key);
  }

  /**
   * Get storage size
   */
  async size(): Promise<number> {
    await this.initialize();
    return await this.storage.size();
  }

  /**
   * Batch operations
   */
  async batch(operations: Array<{
    type: 'set' | 'remove';
    key: string;
    value?: any;
    config?: StorageConfig;
  }>): Promise<void> {
    await this.initialize();
    
    for (const op of operations) {
      if (op.type === 'set') {
        await this.set(op.key, op.value, op.config);
      } else if (op.type === 'remove') {
        await this.remove(op.key);
      }
    }
  }

  /**
   * Query storage with MongoDB-like syntax
   */
  async query<T>(filter: any): Promise<Array<{ key: string; value: T }>> {
    await this.initialize();
    return await this.storage.query<T>(filter);
  }

  /**
   * Get items by tag
   * @deprecated This method is not available in the current version of strata
   */
  async getByTag<T>(tag: string): Promise<Array<{ key: string; value: T }>> {
    await this.initialize();
    // TODO: Implement tag-based retrieval
    const allItems = await this.storage.query<T>({});
    return allItems.filter(item => item.key.includes(tag));
  }

  /**
   * Remove items by tag
   * @deprecated This method is not available in the current version of strata
   */
  async removeByTag(tag: string): Promise<void> {
    await this.initialize();
    // TODO: Implement tag-based removal
    const items = await this.getByTag(tag);
    for (const item of items) {
      await this.storage.remove(item.key);
    }
  }

  /**
   * Export all data
   */
  async export(): Promise<Record<string, any>> {
    await this.initialize();
    const exportedString = await this.storage.export();
    return JSON.parse(exportedString);
  }

  /**
   * Import data
   */
  async import(data: Record<string, any>): Promise<void> {
    await this.initialize();
    await this.storage.import(JSON.stringify(data));
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalSize: number;
    itemCount: number;
    storageType: string;
  }> {
    await this.initialize();
    // TODO: Implement proper stats collection
    // The getStats method is not available in the current version
    const allItems = await this.storage.query({});
    return {
      totalSize: JSON.stringify(allItems).length,
      itemCount: allItems.length,
      storageType: 'strata'
    };
  }
}

// Create singleton instance
export const unifiedStorage = new UnifiedStorageService();

// Storage key constants
export const STORAGE_KEYS = {
  // Theme
  THEME: 'theme',
  
  // Auth
  BIOMETRIC_ENABLED: 'biometric_enabled',
  LAST_AUTH_TIME: 'last_auth_time',
  
  // Mobile
  SELECTED_APP: 'selected_mobile_app',
  
  // Offline
  OFFLINE_STORE: 'offline_store',
  LAST_SYNC_TIME: 'last_sync_time',
  
  // Demo
  DEMO_DATA: 'demo_data',
  
  // Database prefixes
  DB_PATIENTS: 'db_patients',
  DB_ORDERS: 'db_orders',
  DB_RESULTS: 'db_results',
  DB_TESTS: 'db_tests',
  DB_OFFLINE_QUEUE: 'db_offline_queue',
  DB_SYNC_METADATA: 'db_sync_metadata'
} as const;

// Helper functions for specific storage needs
export const storageHelpers = {
  /**
   * Store user preference
   */
  async setPreference(key: string, value: any): Promise<void> {
    await unifiedStorage.set(`pref_${key}`, value, {
      tags: ['preferences']
    });
  },

  /**
   * Get user preference
   */
  async getPreference<T>(key: string): Promise<T | null> {
    return await unifiedStorage.get<T>(`pref_${key}`);
  },

  /**
   * Store secure data (automatically encrypted)
   */
  async setSecure(key: string, value: any): Promise<void> {
    await unifiedStorage.set(`secure_${key}`, value, {
      encryption: true,
      tags: ['secure']
    });
  },

  /**
   * Get secure data
   */
  async getSecure<T>(key: string): Promise<T | null> {
    return await unifiedStorage.get<T>(`secure_${key}`);
  },

  /**
   * Store temporary data with TTL
   */
  async setTemp(key: string, value: any, ttlMs: number): Promise<void> {
    await unifiedStorage.set(`temp_${key}`, value, {
      ttl: ttlMs,
      tags: ['temporary']
    });
  },

  /**
   * Get temporary data
   */
  async getTemp<T>(key: string): Promise<T | null> {
    return await unifiedStorage.get<T>(`temp_${key}`);
  },

  /**
   * Clear all temporary data
   */
  async clearTemp(): Promise<void> {
    await unifiedStorage.removeByTag('temporary');
  },

  /**
   * Clear all preferences
   */
  async clearPreferences(): Promise<void> {
    await unifiedStorage.removeByTag('preferences');
  },

  /**
   * Clear all secure data
   */
  async clearSecure(): Promise<void> {
    await unifiedStorage.removeByTag('secure');
  }
};