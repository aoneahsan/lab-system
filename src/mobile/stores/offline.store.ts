import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Network } from '@capacitor/network';
import { unifiedStorage } from '@/services/unified-storage.service';

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
  addCollection: (collection: Omit<OfflineCollection, 'id' | 'syncStatus'>) => Promise<void>;
  updateCollection: (id: string, updates: Partial<OfflineCollection>) => Promise<void>;
  removeCollection: (id: string) => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  syncCollections: () => Promise<void>;
  initializeDatabase: () => Promise<void>;
}

// Helper function to get all collections from storage
const getStoredCollections = async (): Promise<OfflineCollection[]> => {
  return (await unifiedStorage.get<OfflineCollection[]>('offline_collections')) || [];
};

// Helper function to save all collections to storage
const saveCollectionsToStorage = async (collections: OfflineCollection[]): Promise<void> => {
  await unifiedStorage.set('offline_collections', collections, {
    tags: ['offline-collections'],
    compression: true
  });
};

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      collections: [],
      pendingSync: 0,
      isOnline: true,
      lastSyncTime: null,

      addCollection: async (collection) => {
        const newCollection: OfflineCollection = {
          ...collection,
          id: `col_${Date.now()}`,
          syncStatus: 'pending',
        };

        // Get current collections from storage
        const collections = await getStoredCollections();
        collections.push(newCollection);
        
        // Save to storage
        await saveCollectionsToStorage(collections);

        // Update store state
        set((state) => ({
          collections: [...state.collections, newCollection],
          pendingSync: state.pendingSync + 1,
        }));
      },

      updateCollection: async (id, updates) => {
        // Get current collections from storage
        const collections = await getStoredCollections();
        const updatedCollections = collections.map((col) =>
          col.id === id ? { ...col, ...updates } : col
        );
        
        // Save to storage
        await saveCollectionsToStorage(updatedCollections);

        // Update store state
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === id ? { ...col, ...updates } : col
          ),
        }));
      },

      removeCollection: async (id) => {
        // Get current collections from storage
        const collections = await getStoredCollections();
        const filteredCollections = collections.filter((col) => col.id !== id);
        
        // Save to storage
        await saveCollectionsToStorage(filteredCollections);

        // Update store state
        set((state) => ({
          collections: state.collections.filter((col) => col.id !== id),
          pendingSync: state.collections.filter(
            (col) => col.id !== id && (col.syncStatus === 'pending' || col.syncStatus === 'failed')
          ).length,
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
        for (const col of pendingCollections) {
          await get().updateCollection(col.id, { syncStatus: 'syncing' });
        }

        try {
          // In real app, would make API calls to sync
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

          // Mark as synced
          for (const col of pendingCollections) {
            await get().updateCollection(col.id, { syncStatus: 'synced' });
          }

          set({
            pendingSync: 0,
            lastSyncTime: new Date(),
          });
        } catch (error) {
          // Mark as failed
          for (const col of pendingCollections) {
            await get().updateCollection(col.id, {
              syncStatus: 'failed',
              syncError: error instanceof Error ? error.message : 'Sync failed',
            });
          }
        }
      },

      initializeDatabase: async () => {
        // Initialize unified storage
        await unifiedStorage.initialize();

        // Load collections from storage
        const storedCollections = await getStoredCollections();
        if (storedCollections.length > 0) {
          const pendingCount = storedCollections.filter(
            c => c.syncStatus === 'pending' || c.syncStatus === 'failed'
          ).length;
          
          set({
            collections: storedCollections,
            pendingSync: pendingCount
          });
        }

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
          const result = await unifiedStorage.get(name);
          return (result as any)?.state || null;
        },
        setItem: async (name, value) => {
          await unifiedStorage.set(name, value, {
            tags: ['offline-store', 'zustand']
          });
        },
        removeItem: async (name) => {
          await unifiedStorage.remove(name);
        },
      },
    }
  )
);

// Initialize collections from storage on startup
export const initializeOfflineStore = async () => {
  const store = useOfflineStore.getState();
  await store.initializeDatabase();
};