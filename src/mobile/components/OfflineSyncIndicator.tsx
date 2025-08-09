import React, { useEffect, useState, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { useOfflineSupport } from '@/hooks/offline/useOfflineSupport';

export const OfflineSyncIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { syncOfflineData, getPendingChangesCount } = useOfflineSupport();
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    checkNetworkStatus();
    checkPendingChanges();

    if (Capacitor.isNativePlatform()) {
      const listener = Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
        if (status.connected && pendingChanges > 0) {
          handleSync();
        }
      });

      return () => {
        listener.remove();
      };
    }
  }, [pendingChanges, checkPendingChanges, handleSync, checkNetworkStatus]);

  const checkNetworkStatus = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    }
  }, []);

  const checkPendingChanges = useCallback(async () => {
    const count = await getPendingChangesCount();
    setPendingChanges(count);
  }, [getPendingChangesCount]);

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncMessage('Syncing data...');

    try {
      await syncOfflineData();
      setShowSuccess(true);
      setSyncMessage('All data synced!');
      setPendingChanges(0);
      
      setTimeout(() => {
        setShowSuccess(false);
        setSyncMessage('');
      }, 3000);
    } catch {
      setSyncMessage('Sync failed. Will retry...');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncOfflineData]);

  if (!pendingChanges && isOnline && !showSuccess) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className={`
        px-4 py-2 flex items-center justify-between transition-all duration-300
        ${isOnline 
          ? showSuccess 
            ? 'bg-green-100 border-b border-green-200' 
            : 'bg-blue-100 border-b border-blue-200'
          : 'bg-yellow-100 border-b border-yellow-200'
        }
      `}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            isSyncing ? (
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            ) : showSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Cloud className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <CloudOff className="h-4 w-4 text-yellow-700" />
          )}
          
          <span className={`text-sm font-medium ${
            isOnline 
              ? showSuccess 
                ? 'text-green-700' 
                : 'text-blue-700'
              : 'text-yellow-700'
          }`}>
            {syncMessage || (
              isOnline 
                ? `${pendingChanges} changes pending` 
                : 'Offline mode - changes will sync when connected'
            )}
          </span>
        </div>

        {isOnline && pendingChanges > 0 && !isSyncing && (
          <button
            onClick={handleSync}
            className="text-sm text-blue-600 font-medium active:text-blue-700"
          >
            Sync now
          </button>
        )}
      </div>

      {/* Progress bar for syncing */}
      {isSyncing && (
        <div className="h-1 bg-blue-200">
          <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};