import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

interface OfflineCollection {
  id: string;
  patientId: string;
  patientName: string;
  orderId: string;
  tests: string[];
  barcode: string;
  collectedAt: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  temperature?: number;
  notes?: string;
  photos?: string[];
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
}

interface OfflineState {
  collections: OfflineCollection[];
  pendingSync: number;
  isOnline: boolean;
  lastSyncTime: Date | null;

  // Actions
  addCollection: (collection: Omit<OfflineCollection, 'id' | 'syncStatus'>) => void;
  updateCollection: (id: string, updates: Partial<OfflineCollection>) => void;
  removeCollection: (id: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  syncCollections: () => Promise<void>;
  initializeDatabase: () => Promise<void>;
}

// SQLite database initialization
const initializeOfflineDB = async () => {
  try {
    await sqlite.openStore({
      database: 'labflow_offline',
      table: 'collections',
      encrypted: false,
      mode: 'no-encryption',
    });

    // Create tables
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        order_id TEXT NOT NULL,
        tests TEXT NOT NULL,
        barcode TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        location TEXT NOT NULL,
        temperature REAL,
        notes TEXT,
        photos TEXT,
        sync_status TEXT DEFAULT 'pending',
        sync_error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sqlite.query({
      database: 'labflow_offline',
      statement: createTableQuery,
      values: [],
    });
  } catch (error) {
    console.error('Failed to initialize offline database:', error);
  }
};

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      collections: [],
      pendingSync: 0,
      isOnline: true,
      lastSyncTime: null,

      addCollection: (collection) => {
        const newCollection: OfflineCollection = {
          ...collection,
          id: `col_${Date.now()}`,
          syncStatus: 'pending',
        };

        set((state) => ({
          collections: [...state.collections, newCollection],
          pendingSync: state.pendingSync + 1,
        }));

        // Save to SQLite for persistence
        saveCollectionToDB(newCollection);
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === id ? { ...col, ...updates } : col
          ),
        }));
      },

      removeCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter((col) => col.id !== id),
          pendingSync: Math.max(0, state.pendingSync - 1),
        }));
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        if (isOnline) {
          // Auto-sync when coming online
          get().syncCollections();
        }
      },

      syncCollections: async () => {
        const { collections } = get();
        const pendingCollections = collections.filter(
          (col) => col.syncStatus === 'pending' || col.syncStatus === 'failed'
        );

        if (pendingCollections.length === 0) return;

        // Update status to syncing
        pendingCollections.forEach((col) => {
          get().updateCollection(col.id, { syncStatus: 'syncing' });
        });

        try {
          // In real app, would make API calls to sync
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

          // Mark as synced
          pendingCollections.forEach((col) => {
            get().updateCollection(col.id, { syncStatus: 'synced' });
          });

          set({
            pendingSync: 0,
            lastSyncTime: new Date(),
          });
        } catch (error) {
          // Mark as failed
          pendingCollections.forEach((col) => {
            get().updateCollection(col.id, {
              syncStatus: 'failed',
              syncError: error instanceof Error ? error.message : 'Sync failed',
            });
          });
        }
      },

      initializeDatabase: async () => {
        await initializeOfflineDB();

        // Monitor network status
        const status = await Network.getStatus();
        set({ isOnline: status.connected });

        Network.addListener('networkStatusChange', (status) => {
          get().setOnlineStatus(status.connected);
        });
      },
    }),
    {
      name: 'offline-storage',
      storage: {
        getItem: async (name) => {
          const { value } = await Preferences.get({ key: name });
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await Preferences.set({
            key: name,
            value: JSON.stringify(value),
          });
        },
        removeItem: async (name) => {
          await Preferences.remove({ key: name });
        },
      },
    }
  )
);

// Helper function to save collection to SQLite
const saveCollectionToDB = async (collection: OfflineCollection) => {
  try {
    const query = `
      INSERT INTO collections (
        id, patient_id, patient_name, order_id, tests, barcode,
        collected_at, location, temperature, notes, photos, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await sqlite.query({
      database: 'labflow_offline',
      statement: query,
      values: [
        collection.id,
        collection.patientId,
        collection.patientName,
        collection.orderId,
        JSON.stringify(collection.tests),
        collection.barcode,
        collection.collectedAt.toISOString(),
        JSON.stringify(collection.location),
        collection.temperature || null,
        collection.notes || null,
        JSON.stringify(collection.photos || []),
        collection.syncStatus,
      ],
    });
  } catch (error) {
    console.error('Failed to save collection to database:', error);
  }
};
