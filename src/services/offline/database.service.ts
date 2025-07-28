import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
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
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly dbName = 'labflow_offline.db';
  private readonly platform = Capacitor.getPlatform();
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if running on native platform
      if (this.platform === 'web') {
        console.log('SQLite not available on web platform');
        return;
      }

      // Check connection consistency
      const retCC = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (retCC.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      }

      await this.db.open();
      await this.createTables();
      this.isInitialized = true;

      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Error initializing offline database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Offline sync queue
      `CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        document_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        sync_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Cached data tables
      `CREATE TABLE IF NOT EXISTS cached_patients (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        last_synced INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS cached_samples (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        data TEXT NOT NULL,
        last_synced INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS cached_results (
        id TEXT PRIMARY KEY,
        sample_id TEXT,
        patient_id TEXT,
        data TEXT NOT NULL,
        last_synced INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS cached_appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        data TEXT NOT NULL,
        last_synced INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sync metadata
      `CREATE TABLE IF NOT EXISTS sync_metadata (
        collection TEXT PRIMARY KEY,
        last_sync_timestamp INTEGER,
        sync_status TEXT,
        sync_error TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_offline_queue_synced ON offline_queue(synced)`,
      `CREATE INDEX IF NOT EXISTS idx_offline_queue_collection ON offline_queue(collection)`,
      `CREATE INDEX IF NOT EXISTS idx_cached_samples_patient ON cached_samples(patient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cached_results_patient ON cached_results(patient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cached_results_sample ON cached_results(sample_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cached_appointments_patient ON cached_appointments(patient_id)`,
    ];

    for (const sql of tables) {
      await this.db.execute(sql);
    }
  }

  async queueOperation(
    operation: Omit<OfflineRecord, 'id' | 'timestamp' | 'synced'>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const sql = `
      INSERT INTO offline_queue (id, collection, document_id, operation, data, timestamp, synced)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;

    await this.db.run(sql, [
      id,
      operation.collection,
      operation.documentId,
      operation.operation,
      JSON.stringify(operation.data),
      timestamp,
    ]);
  }

  async getUnsynced(): Promise<OfflineRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(
      'SELECT * FROM offline_queue WHERE synced = 0 ORDER BY timestamp ASC'
    );

    return (
      result.values?.map((row) => ({
        id: row.id,
        collection: row.collection,
        documentId: row.document_id,
        operation: row.operation as 'create' | 'update' | 'delete',
        data: JSON.parse(row.data),
        timestamp: row.timestamp,
        synced: row.synced === 1,
        syncError: row.sync_error,
      })) || []
    );
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('UPDATE offline_queue SET synced = 1 WHERE id = ?', [id]);
  }

  async markSyncError(id: string, error: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('UPDATE offline_queue SET sync_error = ? WHERE id = ?', [error, id]);
  }

  // Cache management methods
  async cacheData(
    collection: string,
    id: string,
    data: any,
    additionalFields?: Record<string, any>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = `cached_${collection}`;
    const timestamp = Date.now();

    const sql = `
      INSERT OR REPLACE INTO ${tableName} (id, data, last_synced${
        additionalFields ? ', ' + Object.keys(additionalFields).join(', ') : ''
      })
      VALUES (?, ?, ?${
        additionalFields
          ? ', ' +
            Object.keys(additionalFields)
              .map(() => '?')
              .join(', ')
          : ''
      })
    `;

    const values = [
      id,
      JSON.stringify(data),
      timestamp,
      ...(additionalFields ? Object.values(additionalFields) : []),
    ];

    await this.db.run(sql, values);
  }

  async getCachedData(collection: string, id?: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = `cached_${collection}`;

    let sql = `SELECT * FROM ${tableName}`;
    const values: any[] = [];

    if (id) {
      sql += ' WHERE id = ?';
      values.push(id);
    }

    const result = await this.db.query(sql, values);

    return (
      result.values?.map((row) => ({
        id: row.id,
        ...JSON.parse(row.data),
        _lastSynced: row.last_synced,
      })) || []
    );
  }

  async getCachedDataByPatient(collection: string, patientId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const tableName = `cached_${collection}`;
    const result = await this.db.query(`SELECT * FROM ${tableName} WHERE patient_id = ?`, [
      patientId,
    ]);

    return (
      result.values?.map((row) => ({
        id: row.id,
        ...JSON.parse(row.data),
        _lastSynced: row.last_synced,
      })) || []
    );
  }

  async clearCache(collection?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (collection) {
      await this.db.execute(`DELETE FROM cached_${collection}`);
    } else {
      // Clear all cache tables
      const tables = ['patients', 'samples', 'results', 'appointments'];
      for (const table of tables) {
        await this.db.execute(`DELETE FROM cached_${table}`);
      }
    }
  }

  async getSyncMetadata(collection: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query('SELECT * FROM sync_metadata WHERE collection = ?', [
      collection,
    ]);

    return result.values?.[0];
  }

  async updateSyncMetadata(collection: string, status: string, error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `INSERT OR REPLACE INTO sync_metadata (collection, last_sync_timestamp, sync_status, sync_error)
       VALUES (?, ?, ?, ?)`,
      [collection, Date.now(), status, error || null]
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
      this.isInitialized = false;
    }
  }

  isAvailable(): boolean {
    return this.platform !== 'web' && this.isInitialized;
  }
}

export const offlineDatabase = new OfflineDatabaseService();
