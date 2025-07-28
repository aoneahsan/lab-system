import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { syncService } from '@/services/offline/sync.service';
import type { SyncStatus } from '@/services/offline/sync.service';
import { offlineDatabase } from '@/services/offline/database.service';

export interface OfflineState {
  isOnline: boolean;
  isOfflineSupported: boolean;
  syncStatus: SyncStatus;
}

export const useOfflineSupport = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isOfflineSupported: false,
    syncStatus: {
      isSyncing: false,
      pendingChanges: 0,
      errors: [],
    },
  });

  useEffect(() => {
    let networkListener: any;
    let syncListener: (() => void) | null = null;

    const init = async () => {
      // Check network status
      const networkStatus = await Network.getStatus();

      // Initialize offline support
      try {
        await syncService.initialize();
        const isSupported = offlineDatabase.isAvailable();

        setState((prev) => ({
          ...prev,
          isOnline: networkStatus.connected,
          isOfflineSupported: isSupported,
        }));

        // Listen for sync status changes
        if (isSupported) {
          syncListener = syncService.addListener((status) => {
            setState((prev) => ({
              ...prev,
              syncStatus: status,
            }));
          });
        }

        // Listen for network changes
        networkListener = await Network.addListener('networkStatusChange', (status) => {
          setState((prev) => ({
            ...prev,
            isOnline: status.connected,
          }));
        });
      } catch (error) {
        console.error('Error initializing offline support:', error);
      }
    };

    init();

    return () => {
      if (networkListener?.remove) {
        networkListener.remove();
      }
      if (syncListener) {
        syncListener();
      }
    };
  }, []);

  const sync = async () => {
    await syncService.sync();
  };

  return {
    ...state,
    sync,
  };
};
