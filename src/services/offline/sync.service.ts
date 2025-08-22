import { offlineDatabase } from './database.service';
import { Network } from '@capacitor/network';
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
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from 'sonner';
import { logger } from '@/services/logger.service';

export interface SyncStatus {
  isSyncing: boolean;
  lastSync?: Date;
  pendingChanges: number;
  errors: string[];
}

class SyncService {
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private networkListener: any = null;

  async initialize(): Promise<void> {
    try {
      await offlineDatabase.initialize();

      // Set up network monitoring
      this.networkListener = await Network.addListener('networkStatusChange', async (status) => {
        logger.log('Network status changed:', status);
        if (status.connected) {
          // Network is back online, trigger sync
          this.sync();
        }
      });

      // Start periodic sync (every 5 minutes)
      this.startPeriodicSync();

      // Initial sync if online
      const networkStatus = await Network.getStatus();
      if (networkStatus.connected) {
        this.sync();
      }
    } catch (error) {
      logger.error('Error initializing sync service:', error);
    }
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(
      () => {
        this.sync();
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  async sync(): Promise<void> {
    if (this.syncInProgress || !offlineDatabase.isAvailable()) return;

    const networkStatus = await Network.getStatus();
    if (!networkStatus.connected) {
      logger.log('No network connection, skipping sync');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      logger.log('Starting sync...');

      // Get unsynced changes
      const unsyncedRecords = await offlineDatabase.getUnsynced();
      logger.log(`Found ${unsyncedRecords.length} unsynced records`);

      // Process each record
      for (const record of unsyncedRecords) {
        try {
          await this.processSyncRecord(record);
          await offlineDatabase.markSynced(record.id);
        } catch (error) {
          logger.error(`Error syncing record ${record.id}:`, error);
          await offlineDatabase.markSyncError(
            record.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      // Pull latest data from server
      await this.pullLatestData();

      // Update sync metadata
      await offlineDatabase.updateSyncMetadata('all', {
        status: 'completed',
        timestamp: Date.now()
      });

      logger.log('Sync completed successfully');
      toast.success('Data synchronized successfully');
    } catch (error) {
      logger.error('Sync error:', error);
      await offlineDatabase.updateSyncMetadata('all', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      toast.error('Failed to sync data');
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async processSyncRecord(record: any): Promise<void> {
    const collectionRef = collection(db, record.collection);
    const docRef = doc(collectionRef, record.documentId);

    switch (record.operation) {
      case 'create':
        await setDoc(docRef, {
          ...record.data,
          createdAt: new Date(record.timestamp),
          updatedAt: new Date(record.timestamp),
        });
        break;

      case 'update':
        await updateDoc(docRef, {
          ...record.data,
          updatedAt: new Date(record.timestamp),
        });
        break;

      case 'delete':
        await deleteDoc(docRef);
        break;

      default:
        throw new Error(`Unknown operation: ${record.operation}`);
    }
  }

  private async pullLatestData(): Promise<void> {
    // Pull latest data for each collection
    const collections = ['patients', 'samples', 'results', 'appointments'];

    for (const collectionName of collections) {
      try {
        const metadata = await offlineDatabase.getSyncMetadata(collectionName);
        const lastSync = metadata?.last_sync_timestamp || 0;

        // Query for documents updated after last sync
        const q = query(
          collection(db, `labflow_${collectionName}`),
          where('updatedAt', '>', new Date(lastSync)),
          orderBy('updatedAt', 'desc'),
          limit(100) // Limit to prevent large downloads
        );

        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const additionalFields: Record<string, any> = {};

          // Add relationship fields based on collection
          if (collectionName === 'samples' && data.patientId) {
            additionalFields.patient_id = data.patientId;
          } else if (collectionName === 'results') {
            if (data.sampleId) additionalFields.sample_id = data.sampleId;
            if (data.patientId) additionalFields.patient_id = data.patientId;
          } else if (collectionName === 'appointments' && data.patientId) {
            additionalFields.patient_id = data.patientId;
          }

          await offlineDatabase.cacheData(collectionName, doc.id, {
            ...data,
            ...additionalFields
          });
        }

        await offlineDatabase.updateSyncMetadata(collectionName, {
          status: 'completed',
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error(`Error pulling data for ${collectionName}:`, error);
        await offlineDatabase.updateSyncMetadata(collectionName, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
    }
  }

  async queueOperation(
    collection: string,
    documentId: string,
    operation: 'create' | 'update' | 'delete',
    data?: any
  ): Promise<void> {
    if (!offlineDatabase.isAvailable()) {
      // If offline support not available, throw error
      throw new Error('Offline support not available');
    }

    await offlineDatabase.queueOperation({
      collection,
      documentId,
      operation,
      data: data || {},
    });

    // Notify listeners about pending changes
    this.notifyListeners();
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingChanges = await offlineDatabase.getUnsynced();
    const metadata = await offlineDatabase.getSyncMetadata('all');

    return {
      isSyncing: this.syncInProgress,
      lastSync: metadata?.last_sync_timestamp ? new Date(metadata.last_sync_timestamp) : undefined,
      pendingChanges: pendingChanges.length,
      errors: pendingChanges.filter((r) => r.syncError).map((r) => r.syncError!),
    };
  }

  addListener(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.syncListeners.forEach((callback) => callback(status));
  }

  async destroy(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.networkListener) {
      await this.networkListener.remove();
      this.networkListener = null;
    }

    await offlineDatabase.close();
  }
}

export const syncService = new SyncService();
