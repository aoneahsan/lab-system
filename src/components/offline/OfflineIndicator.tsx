import React from 'react';
import { WifiOff, Sync, Check, AlertCircle } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { formatDistanceToNow } from 'date-fns';

export const OfflineIndicator: React.FC = () => {
  const {
    isOffline,
    pendingChanges,
    lastSyncTime,
    syncInProgress,
    syncProgress,
    syncNow,
    isOfflineSupported
  } = useOffline();

  // Don't show anything if offline support is not available
  if (!isOfflineSupported || (!isOffline && pendingChanges === 0)) {
    return null;
  }

  const getSyncStatusIcon = () => {
    if (syncInProgress) {
      return <Sync className="w-4 h-4 animate-spin" />;
    }
    if (isOffline) {
      return <WifiOff className="w-4 h-4" />;
    }
    if (pendingChanges > 0) {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Check className="w-4 h-4" />;
  };

  const getSyncStatusColor = () => {
    if (isOffline) return 'bg-red-100 text-red-700 border-red-200';
    if (pendingChanges > 0) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getSyncStatusText = () => {
    if (syncInProgress && syncProgress) {
      const percent = Math.round((syncProgress.completed / syncProgress.total) * 100);
      return `Syncing... ${percent}%`;
    }
    if (isOffline) {
      return 'Offline Mode';
    }
    if (pendingChanges > 0) {
      return `${pendingChanges} pending ${pendingChanges === 1 ? 'change' : 'changes'}`;
    }
    if (lastSyncTime) {
      return `Last sync ${formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}`;
    }
    return 'Synced';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg
          ${getSyncStatusColor()}
          transition-all duration-300 ease-in-out
        `}
      >
        {getSyncStatusIcon()}
        <span className="text-sm font-medium">
          {getSyncStatusText()}
        </span>
        
        {!syncInProgress && (isOffline || pendingChanges > 0) && (
          <button
            onClick={syncNow}
            className="ml-2 text-xs underline hover:no-underline"
            disabled={syncInProgress}
          >
            Sync Now
          </button>
        )}
      </div>

      {/* Sync progress bar */}
      {syncInProgress && syncProgress && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ 
              width: `${(syncProgress.completed / syncProgress.total) * 100}%` 
            }}
          />
        </div>
      )}

      {/* Error message */}
      {syncProgress?.lastError && (
        <div className="mt-2 text-xs text-red-600 max-w-xs">
          Error: {syncProgress.lastError}
        </div>
      )}
    </div>
  );
};