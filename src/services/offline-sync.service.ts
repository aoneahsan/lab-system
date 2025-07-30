import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import { offlineDbService, OfflineQueueItem } from './offline-db.service';
import { Network } from '@capacitor/network';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ operation: OfflineQueueItem; error: string }>;
}

export interface SyncProgress {
  total: number;
  completed: number;
  inProgress: boolean;
  lastError?: string;
}

class OfflineSyncService {
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncProgressCallbacks: ((progress: SyncProgress) => void)[] = [];
  private networkListener: any = null;

  async initialize(): Promise<void> {
    try {
      // Initialize offline database
      await offlineDbService.initialize();

      // Set up network listener
      this.networkListener = await Network.addListener('networkStatusChange', async (status) => {
        if (status.connected) {
          console.log('Network connection restored, initiating sync...');
          await this.performSync();
        }
      });

      // Check current network status
      const status = await Network.getStatus();
      if (status.connected) {
        // Perform initial sync
        await this.performSync();
      }

      // Set up periodic sync (every 5 minutes when online)
      this.startPeriodicSync();
    } catch (error) {
      console.error('Failed to initialize offline sync service:', error);
      // Don't throw error to prevent app from crashing
    }
  }

  // Start periodic sync
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(
      async () => {
        const status = await Network.getStatus();
        if (status.connected && !this.syncInProgress) {
          await this.performSync();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  // Stop periodic sync
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Subscribe to sync progress
  onSyncProgress(callback: (progress: SyncProgress) => void): () => void {
    this.syncProgressCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.syncProgressCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncProgressCallbacks.splice(index, 1);
      }
    };
  }

  // Notify progress subscribers
  private notifyProgress(progress: SyncProgress): void {
    this.syncProgressCallbacks.forEach((callback) => callback(progress));
  }

  // Perform sync
  async performSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('No network connection, skipping sync...');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get pending operations
      const pendingOps = await offlineDbService.getPendingOperations();
      const total = pendingOps.length;

      this.notifyProgress({
        total,
        completed: 0,
        inProgress: true,
      });

      // Process each operation
      for (let i = 0; i < pendingOps.length; i++) {
        const op = pendingOps[i];

        try {
          await this.syncOperation(op);
          await offlineDbService.markAsSynced(op.id);
          result.synced++;
        } catch (error: any) {
          console.error('Sync operation failed:', error);
          await offlineDbService.updateRetryInfo(op.id, error.message);
          result.failed++;
          result.errors.push({ operation: op, error: error.message });
          result.success = false;
        }

        this.notifyProgress({
          total,
          completed: i + 1,
          inProgress: true,
          lastError:
            result.errors.length > 0 ? result.errors[result.errors.length - 1].error : undefined,
        });
      }

      // Update last sync time
      await offlineDbService.getMetadata();
      await offlineDbService.updateMetadata({ lastSyncTime: Date.now() });

      // Fetch latest data from server
      await this.fetchLatestData();
    } catch (error: any) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push({
        operation: {} as OfflineQueueItem,
        error: error.message,
      });
    } finally {
      this.syncInProgress = false;
      this.notifyProgress({
        total: result.synced + result.failed,
        completed: result.synced + result.failed,
        inProgress: false,
      });
    }

    return result;
  }

  // Sync individual operation
  private async syncOperation(op: OfflineQueueItem): Promise<void> {
    const { collection: collectionName, operation, data } = op;

    switch (operation) {
      case 'create':
        await this.syncCreate(collectionName, data);
        break;
      case 'update':
        await this.syncUpdate(collectionName, data);
        break;
      case 'delete':
        await this.syncDelete(collectionName, data);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Sync create operation
  private async syncCreate(collectionName: string, data: any): Promise<void> {
    if (data.id) {
      // Use setDoc if ID is provided
      await setDoc(doc(db, collectionName, data.id), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Use addDoc for auto-generated ID
      const { ...dataWithoutId } = data;
      await setDoc(doc(collection(db, collectionName)), {
        ...dataWithoutId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  }

  // Sync update operation
  private async syncUpdate(collectionName: string, data: any): Promise<void> {
    if (!data.id) {
      throw new Error('Update operation requires document ID');
    }

    const { id, ...updates } = data;
    await updateDoc(doc(db, collectionName, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  // Sync delete operation
  private async syncDelete(collectionName: string, data: any): Promise<void> {
    if (!data.id) {
      throw new Error('Delete operation requires document ID');
    }

    await deleteDoc(doc(db, collectionName, data.id));
  }

  // Fetch latest data from server
  private async fetchLatestData(): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    if (!tenantId) return;

    // Define collections to sync
    const collectionsToSync = [
      { name: COLLECTIONS.PATIENTS, limit: 100 },
      { name: COLLECTIONS.TESTS, limit: 200 },
      { name: COLLECTIONS.ORDERS, limit: 50 },
      { name: COLLECTIONS.RESULTS, limit: 100 },
    ];

    for (const { name, limit: fetchLimit } of collectionsToSync) {
      try {
        const q = query(
          collection(db, name),
          where('tenantId', '==', tenantId),
          orderBy('updatedAt', 'desc'),
          limit(fetchLimit)
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        await offlineDbService.cacheData(name, tenantId, data);
      } catch (error) {
        console.error(`Failed to fetch ${name}:`, error);
      }
    }
  }

  // Get current tenant ID (would come from auth/user context)
  private getCurrentTenantId(): string | null {
    // This would typically come from your auth context
    // For now, returning a placeholder
    return localStorage.getItem('currentTenantId');
  }

  // Check if offline mode is active
  async isOffline(): Promise<boolean> {
    const status = await Network.getStatus();
    return !status.connected;
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOffline: boolean;
    pendingChanges: number;
    lastSyncTime: number;
  }> {
    const isOffline = await this.isOffline();
    const metadata = await offlineDbService.getMetadata();

    return {
      isOffline,
      pendingChanges: metadata.pendingChanges,
      lastSyncTime: metadata.lastSyncTime,
    };
  }

  // Manual sync trigger
  async syncNow(): Promise<SyncResult> {
    return this.performSync();
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    this.stopPeriodicSync();
    await offlineDbService.clearOfflineData();
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.stopPeriodicSync();

    if (this.networkListener) {
      await this.networkListener.remove();
      this.networkListener = null;
    }

    await offlineDbService.close();
  }
}

export const offlineSyncService = new OfflineSyncService();
