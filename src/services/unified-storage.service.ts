import { storage } from 'strata-storage';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/services/logger.service';

export interface StorageConfig {
  encryption?: boolean;
  compression?: boolean;
  ttl?: number;
  tags?: string[];
}

/**
 * Unified storage service using strata-storage
 * Provides a unified API for storage needs across web, iOS, and Android
 */
class UnifiedStorageService {
  private initialized = false;
  private projectPrefix = 'labflow';

  constructor() {
    // Strata-storage has zero configuration - works immediately
    logger.log('UnifiedStorageService initialized with strata-storage');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if running on native platform
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Import Capacitor adapters only when on native platform
        try {
          const { registerCapacitorAdapters } = await import('strata-storage/capacitor');
          await registerCapacitorAdapters(storage);
          logger.log('Capacitor storage adapters registered');
        } catch (error) {
          logger.warn('Failed to register Capacitor adapters:', error);
        }
      }

      this.initialized = true;
      logger.log(`Storage initialized for ${isNative ? 'native' : 'web'} platform`);
    } catch (error) {
      logger.error('Storage initialization error:', error);
      this.initialized = true; // Mark as initialized even if there's an error
    }
  }

  private getPrefixedKey(key: string): string {
    return `${this.projectPrefix}_${key}`;
  }

  async set<T>(key: string, value: T, config?: StorageConfig): Promise<void> {
    await this.initialize();
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      await storage.set(prefixedKey, value, {
        storage: 'indexedDB', // Primary storage
        fallback: ['localStorage', 'sessionStorage', 'memory'], // Fallback chain
        ttl: config?.ttl,
        encrypt: config?.encryption || false,
        compress: config?.compression || false,
        tags: config?.tags
      });
    } catch (error) {
      logger.error(`Error setting storage key ${key}:`, error);
      // Try memory storage as last resort
      try {
        await storage.set(prefixedKey, value, {
          storage: 'memory',
          ttl: config?.ttl,
          tags: config?.tags
        });
      } catch (memoryError) {
        logger.error('Failed to store in memory:', memoryError);
        throw error;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.initialize();
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const value = await storage.get<T>(prefixedKey);
      return value ?? null;
    } catch (error) {
      logger.error(`Error getting storage key ${key}:`, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await this.initialize();
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      await storage.remove(prefixedKey);
    } catch (error) {
      logger.error(`Error removing storage key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    await this.initialize();
    
    try {
      // Get all keys and filter by prefix
      const allKeys = await storage.keys();
      const prefixedKeys = allKeys.filter(key => key.startsWith(this.projectPrefix));
      
      // Remove all prefixed keys
      for (const key of prefixedKeys) {
        await storage.remove(key);
      }
    } catch (error) {
      logger.error('Error clearing storage:', error);
    }
  }

  async keys(): Promise<string[]> {
    await this.initialize();
    
    try {
      const allKeys = await storage.keys();
      // Filter and remove prefix
      return allKeys
        .filter(key => key.startsWith(this.projectPrefix))
        .map(key => key.replace(`${this.projectPrefix}_`, ''));
    } catch (error) {
      logger.error('Error getting storage keys:', error);
      return [];
    }
  }

  async has(key: string): Promise<boolean> {
    await this.initialize();
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      return await storage.has(prefixedKey);
    } catch (error) {
      logger.error(`Error checking storage key ${key}:`, error);
      return false;
    }
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  // Batch operations
  async batch(operations: Array<{
    type: 'set' | 'remove';
    key: string;
    value?: any;
    config?: StorageConfig;
  }>): Promise<void> {
    for (const op of operations) {
      if (op.type === 'set' && op.value !== undefined) {
        await this.set(op.key, op.value, op.config);
      } else if (op.type === 'remove') {
        await this.remove(op.key);
      }
    }
  }

  // Query operations
  async query<T>(filter?: { tags?: string[] }): Promise<Array<{ key: string; value: T }>> {
    await this.initialize();
    
    try {
      const results: Array<{ key: string; value: T }> = [];
      
      if (filter?.tags && filter.tags.length > 0) {
        // Query by tags
        for (const tag of filter.tags) {
          const taggedItems = await storage.query<T>({ tag });
          for (const item of taggedItems) {
            if (item.key.startsWith(this.projectPrefix)) {
              results.push({
                key: item.key.replace(`${this.projectPrefix}_`, ''),
                value: item.value
              });
            }
          }
        }
      } else {
        // Get all items
        const keys = await this.keys();
        for (const key of keys) {
          const value = await this.get<T>(key);
          if (value !== null) {
            results.push({ key, value });
          }
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error querying storage:', error);
      return [];
    }
  }

  async getByTag<T>(tag: string): Promise<Array<{ key: string; value: T }>> {
    return this.query<T>({ tags: [tag] });
  }

  async removeByTag(tag: string): Promise<void> {
    const items = await this.getByTag(tag);
    for (const item of items) {
      await this.remove(item.key);
    }
  }

  // Import/Export operations
  async export(): Promise<Record<string, any>> {
    const data: Record<string, any> = {};
    const keys = await this.keys();
    
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        data[key] = value;
      }
    }
    
    return data;
  }

  async import(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }

  // Statistics
  async getStats(): Promise<{
    totalSize: number;
    itemCount: number;
    storageType: string;
  }> {
    const itemCount = await this.size();
    
    return {
      totalSize: 0, // Size calculation not available in strata-storage yet
      itemCount,
      storageType: 'strata-storage'
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
  async setPreference(key: string, value: any): Promise<void> {
    await unifiedStorage.set(`pref_${key}`, value, {
      tags: ['preferences']
    });
  },

  async getPreference<T>(key: string): Promise<T | null> {
    return await unifiedStorage.get<T>(`pref_${key}`);
  },

  async setSecure(key: string, value: any): Promise<void> {
    await unifiedStorage.set(`secure_${key}`, value, {
      encryption: true,
      tags: ['secure']
    });
  },

  async getSecure<T>(key: string): Promise<T | null> {
    return await unifiedStorage.get<T>(`secure_${key}`);
  },

  async setTemp(key: string, value: any, ttlMs: number): Promise<void> {
    await unifiedStorage.set(`temp_${key}`, value, {
      ttl: ttlMs,
      tags: ['temporary']
    });
  },

  async getTemp<T>(key: string): Promise<T | null> {
    return await unifiedStorage.get<T>(`temp_${key}`);
  },

  async clearTemp(): Promise<void> {
    await unifiedStorage.removeByTag('temporary');
  },

  async clearPreferences(): Promise<void> {
    await unifiedStorage.removeByTag('preferences');
  },

  async clearSecure(): Promise<void> {
    await unifiedStorage.removeByTag('secure');
  }
};