import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService } from '@/services/offline-sync.service';
import { offlineDbService } from '@/services/offline-db.service';
import type { SyncProgress } from '@/services/offline-sync.service';

export interface OfflineState {
  isOffline: boolean;
  pendingChanges: number;
  lastSyncTime: number;
  syncInProgress: boolean;
  syncProgress?: SyncProgress;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOffline: false,
    pendingChanges: 0,
    lastSyncTime: 0,
    syncInProgress: false
  });

  // Initialize offline services
  useEffect(() => {
    const init = async () => {
      try {
        await offlineSyncService.initialize();
        const status = await offlineSyncService.getSyncStatus();
        setState(prev => ({
          ...prev,
          isOffline: status.isOffline,
          pendingChanges: status.pendingChanges,
          lastSyncTime: status.lastSyncTime
        }));
      } catch (error) {
        console.error('Failed to initialize offline services:', error);
      }
    };

    init();

    // Subscribe to sync progress
    const unsubscribe = offlineSyncService.onSyncProgress((progress) => {
      setState(prev => ({
        ...prev,
        syncInProgress: progress.inProgress,
        syncProgress: progress
      }));
    });

    // Check sync status periodically
    const interval = setInterval(async () => {
      const status = await offlineSyncService.getSyncStatus();
      setState(prev => ({
        ...prev,
        isOffline: status.isOffline,
        pendingChanges: status.pendingChanges,
        lastSyncTime: status.lastSyncTime
      }));
    }, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Sync now
  const syncNow = useCallback(async () => {
    try {
      await offlineSyncService.syncNow();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }, []);

  // Queue operation for offline sync
  const queueOperation = useCallback(async (
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ) => {
    try {
      await offlineDbService.queueOperation(collection, operation, data);
      
      // Update pending changes count
      const status = await offlineSyncService.getSyncStatus();
      setState(prev => ({
        ...prev,
        pendingChanges: status.pendingChanges
      }));
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback(async (
    collection: string,
    tenantId: string,
    filters?: any
  ) => {
    try {
      return await offlineDbService.getCachedData(collection, tenantId, filters);
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return [];
    }
  }, []);

  // Get cached record
  const getCachedRecord = useCallback(async (
    collection: string,
    id: string
  ) => {
    try {
      return await offlineDbService.getCachedRecord(collection, id);
    } catch (error) {
      console.error('Failed to get cached record:', error);
      return null;
    }
  }, []);

  // Update cached record
  const updateCachedRecord = useCallback(async (
    collection: string,
    id: string,
    updates: any
  ) => {
    try {
      await offlineDbService.updateCachedRecord(collection, id, updates);
    } catch (error) {
      console.error('Failed to update cached record:', error);
      throw error;
    }
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineSyncService.clearOfflineData();
      setState(prev => ({
        ...prev,
        pendingChanges: 0,
        lastSyncTime: 0
      }));
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    syncNow,
    queueOperation,
    getCachedData,
    getCachedRecord,
    updateCachedRecord,
    clearOfflineData,
    isOfflineSupported: offlineDbService.isOfflineSupported()
  };
}