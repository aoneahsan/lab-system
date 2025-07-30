import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { COLLECTIONS } from '@/config/firebase-collections';
import type { OfflineQueueItem, OfflineMetadata } from './offline-db.service';

// Native implementation using SQLite
export class OfflineDbNativeService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'labflow_offline.db';
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create connection
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      }

      await this.db.open();
      await this.createTables();
      this.isInitialized = true;
      console.log('SQLite offline database initialized');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Offline queue for pending operations
      `CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      )`,

      // Offline metadata
      `CREATE TABLE IF NOT EXISTS offline_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,

      // Cached collections
      `CREATE TABLE IF NOT EXISTS cached_patients (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        data TEXT NOT NULL,
        last_updated INTEGER NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS cached_orders (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        patient_id TEXT,
        data TEXT NOT NULL,
        last_updated INTEGER NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS cached_results (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        order_id TEXT,
        patient_id TEXT,
        data TEXT NOT NULL,
        last_updated INTEGER NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS cached_tests (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        data TEXT NOT NULL,
        last_updated INTEGER NOT NULL
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_queue_synced ON offline_queue(synced)`,
      `CREATE INDEX IF NOT EXISTS idx_patients_tenant ON cached_patients(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_tenant ON cached_orders(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_patient ON cached_orders(patient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_results_order ON cached_results(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_results_patient ON cached_results(patient_id)`,
    ];

    for (const query of tables) {
      await this.db.execute(query);
    }
  }

  // Queue operations for sync
  async queueOperation(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const query = `
      INSERT INTO offline_queue (id, collection, operation, data, timestamp, synced, retry_count)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `;

    await this.db.run(query, [id, collection, operation, JSON.stringify(data), Date.now()]);

    await this.updatePendingCount();
  }

  // Get pending operations
  async getPendingOperations(): Promise<OfflineQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM offline_queue 
      WHERE synced = 0 
      ORDER BY timestamp ASC
    `;

    const result = await this.db.query(query);

    return (
      result.values?.map((row) => ({
        id: row.id,
        collection: row.collection,
        operation: row.operation as 'create' | 'update' | 'delete',
        data: JSON.parse(row.data),
        timestamp: row.timestamp,
        synced: row.synced === 1,
        retryCount: row.retry_count,
        lastError: row.last_error,
      })) || []
    );
  }

  // Mark operation as synced
  async markAsSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `UPDATE offline_queue SET synced = 1 WHERE id = ?`;
    await this.db.run(query, [id]);
    await this.updatePendingCount();
  }

  // Update retry count and error
  async updateRetryInfo(id: string, error: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE offline_queue 
      SET retry_count = retry_count + 1, last_error = ? 
      WHERE id = ?
    `;
    await this.db.run(query, [error, id]);
  }

  // Cache data locally
  async cacheData(collection: string, tenantId: string, data: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = this.getTableName(collection);
    if (!tableName) return;

    // Clear existing data for tenant
    await this.db.run(`DELETE FROM ${tableName} WHERE tenant_id = ?`, [tenantId]);

    // Insert new data
    for (const item of data) {
      const query = `
        INSERT INTO ${tableName} (id, tenant_id, data, last_updated)
        VALUES (?, ?, ?, ?)
      `;

      let additionalParams = [];
      if (collection === COLLECTIONS.ORDERS && item.patientId) {
        additionalParams = [item.patientId];
      } else if (collection === COLLECTIONS.RESULTS) {
        additionalParams = [item.orderId || null, item.patientId || null];
      }

      await this.db.run(query, [
        item.id,
        tenantId,
        JSON.stringify(item),
        Date.now(),
        ...additionalParams,
      ]);
    }

    await this.updateCollectionMetadata(collection, data.length);
  }

  // Get cached data
  async getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = this.getTableName(collection);
    if (!tableName) return [];

    let query = `SELECT data FROM ${tableName} WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    // Add filters
    if (filters) {
      if (filters.patientId) {
        query += ` AND patient_id = ?`;
        params.push(filters.patientId);
      }
      if (filters.orderId) {
        query += ` AND order_id = ?`;
        params.push(filters.orderId);
      }
    }

    query += ` ORDER BY last_updated DESC`;

    const result = await this.db.query(query, params);

    return result.values?.map((row) => JSON.parse(row.data)) || [];
  }

  // Get specific cached record
  async getCachedRecord(collection: string, id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = this.getTableName(collection);
    if (!tableName) return null;

    const query = `SELECT data FROM ${tableName} WHERE id = ?`;
    const result = await this.db.query(query, [id]);

    if (result.values && result.values.length > 0) {
      return JSON.parse(result.values[0].data);
    }

    return null;
  }

  // Update cached record
  async updateCachedRecord(collection: string, id: string, updates: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = this.getTableName(collection);
    if (!tableName) return;

    // Get existing record
    const existingRecord = await this.getCachedRecord(collection, id);
    if (!existingRecord) return;

    // Merge updates
    const updatedRecord = { ...existingRecord, ...updates };

    const query = `
      UPDATE ${tableName} 
      SET data = ?, last_updated = ? 
      WHERE id = ?
    `;

    await this.db.run(query, [JSON.stringify(updatedRecord), Date.now(), id]);
  }

  // Get offline metadata
  async getMetadata(): Promise<OfflineMetadata> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `SELECT key, value FROM offline_metadata`;
    const result = await this.db.query(query);

    const metadata: any = {
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {},
    };

    result.values?.forEach((row) => {
      if (row.key === 'metadata') {
        Object.assign(metadata, JSON.parse(row.value));
      }
    });

    return metadata;
  }

  // Update metadata
  async updateMetadata(updates: Partial<OfflineMetadata>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const current = await this.getMetadata();
    const updated = { ...current, ...updates };

    const query = `
      INSERT OR REPLACE INTO offline_metadata (key, value)
      VALUES ('metadata', ?)
    `;

    await this.db.run(query, [JSON.stringify(updated)]);
  }

  // Update pending count
  private async updatePendingCount(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `SELECT COUNT(*) as count FROM offline_queue WHERE synced = 0`;
    const result = await this.db.query(query);

    const count = result.values?.[0]?.count || 0;
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

  // Get table name for collection
  private getTableName(collection: string): string | null {
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
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      'offline_queue',
      'cached_patients',
      'cached_orders',
      'cached_results',
      'cached_tests',
    ];

    for (const table of tables) {
      await this.db.run(`DELETE FROM ${table}`);
    }

    await this.updateMetadata({
      lastSyncTime: 0,
      pendingChanges: 0,
      collections: {},
    });
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Check if offline mode is supported
  isOfflineSupported(): boolean {
    return true;
  }
}