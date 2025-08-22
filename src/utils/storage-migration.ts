import { unifiedStorage, STORAGE_KEYS } from '@/services/unified-storage.service';
import { logger } from '@/services/logger.service';

/**
 * Storage Migration Utility
 * Migrates data from old storage solutions to unified strata-storage
 */
export class StorageMigration {
  private migrationKey = 'storage_migration_completed';

  /**
   * Check if migration has already been completed
   */
  async isMigrationCompleted(): Promise<boolean> {
    return (await unifiedStorage.get<boolean>(this.migrationKey)) || false;
  }

  /**
   * Run the complete migration
   */
  async runMigration(): Promise<void> {
    if (await this.isMigrationCompleted()) {
      logger.log('Storage migration already completed');
      return;
    }

    logger.log('Starting storage migration...');

    try {
      // Migrate localStorage data
      await this.migrateLocalStorage();

      // Skip Capacitor Preferences migration as package is removed
      // await this.migrateCapacitorPreferences();

      // Migrate Dexie/IndexedDB data (if exists)
      await this.migrateDexieData();

      // Mark migration as completed
      await unifiedStorage.set(this.migrationKey, true, {
        tags: ['system-metadata']
      });

      logger.log('Storage migration completed successfully');
    } catch (error) {
      logger.error('Storage migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate data from localStorage
   */
  private async migrateLocalStorage(): Promise<void> {
    logger.log('Migrating localStorage data...');

    const keysToMigrate = [
      { old: 'vite-ui-theme', new: STORAGE_KEYS.THEME },
      { old: 'labflow_demo_data', new: STORAGE_KEYS.DEMO_DATA },
    ];

    for (const { old, new: newKey } of keysToMigrate) {
      try {
        const value = localStorage.getItem(old);
        if (value) {
          // Parse JSON if possible
          let parsedValue;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value;
          }

          await unifiedStorage.set(newKey, parsedValue, {
            tags: ['migrated-data', 'localStorage']
          });

          // Remove from localStorage after successful migration
          localStorage.removeItem(old);
          logger.log(`Migrated localStorage key: ${old} -> ${newKey}`);
        }
      } catch (error) {
        logger.error(`Failed to migrate localStorage key ${old}:`, error);
      }
    }
  }

  /**
   * Migrate data from Capacitor Preferences - Skipped as package is removed
   */
  private async migrateCapacitorPreferences(): Promise<void> {
    // Migration skipped - Capacitor Preferences package has been removed
    logger.log('Skipping Capacitor Preferences migration - package removed');
  }

  /**
   * Migrate data from Dexie/IndexedDB
   */
  private async migrateDexieData(): Promise<void> {
    logger.log('Migrating Dexie/IndexedDB data...');

    try {
      // Check if IndexedDB database exists
      const dbName = 'labflow_offline';
      const tables = ['patients', 'orders', 'results', 'tests', 'offlineQueue', 'syncMetadata'];
      
      // Try to open IndexedDB directly
      const request = indexedDB.open(dbName);
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Check if database has any object stores
        if (db.objectStoreNames.length === 0) {
          db.close();
          return;
        }
        
        // Create a transaction to read all stores
        const transaction = db.transaction(Array.from(db.objectStoreNames), 'readonly');
        
        for (const storeName of db.objectStoreNames) {
          if (tables.includes(storeName)) {
            try {
              const store = transaction.objectStore(storeName);
              const getAllRequest = store.getAll();
              
              getAllRequest.onsuccess = async () => {
                const records = getAllRequest.result;
                if (records && records.length > 0) {
                  const storageKey = `db_${storeName}`;
                  await unifiedStorage.set(storageKey, records, {
                    tags: ['migrated-data', 'indexeddb', storeName],
                    compression: true
                  });
                  logger.log(`Migrated ${records.length} records from IndexedDB table: ${storeName}`);
                }
              };
            } catch (error) {
              logger.error(`Failed to migrate IndexedDB table ${storeName}:`, error);
            }
          }
        }
        
        // Close and delete the old database
        db.close();
        indexedDB.deleteDatabase(dbName);
        logger.log('Deleted old IndexedDB database');
      };
      
      request.onerror = () => {
        logger.log('No existing IndexedDB database to migrate');
      };
    } catch (error) {
      logger.error('Failed to migrate Dexie data:', error);
    }
  }

  /**
   * Rollback migration (for development/testing)
   */
  async rollbackMigration(): Promise<void> {
    await unifiedStorage.remove(this.migrationKey);
    logger.log('Migration rollback completed');
  }
}

// Create singleton instance
export const storageMigration = new StorageMigration();

/**
 * Run migration on app startup
 */
export async function runStorageMigration(): Promise<void> {
  try {
    await storageMigration.runMigration();
  } catch (error) {
    logger.error('Failed to run storage migration:', error);
  }
}