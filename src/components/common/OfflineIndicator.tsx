import React from 'react';
import { RefreshCw, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { useOfflineSupport } from '@/hooks/offline/useOfflineSupport';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isOfflineSupported, syncStatus, sync } = useOfflineSupport();

  if (!isOfflineSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <div 
        className="flex items-center gap-1"
        title={isOnline ? 'Connected to server' : 'Working offline'}
      >
        {isOnline ? (
          <Cloud className="h-4 w-4 text-green-500" />
        ) : (
          <CloudOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-xs font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Pending Changes */}
      {syncStatus.pendingChanges > 0 && (
        <div title={`${syncStatus.pendingChanges} changes pending sync`}>
          <Badge 
            variant="outline" 
            className="gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {syncStatus.pendingChanges}
          </Badge>
        </div>
      )}

      {/* Sync Button */}
      {isOnline && !syncStatus.isSyncing && syncStatus.pendingChanges > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={sync}
          className="h-7 px-2"
          title="Sync changes"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}

      {/* Syncing Indicator */}
      {syncStatus.isSyncing && (
        <div className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-xs">Syncing...</span>
        </div>
      )}

      {/* Last Sync Time */}
      {syncStatus.lastSync && !syncStatus.isSyncing && (
        <span 
          className="text-xs text-muted-foreground"
          title={`Last synced: ${syncStatus.lastSync.toLocaleString()}`}
        >
          {formatLastSync(syncStatus.lastSync)}
        </span>
      )}
    </div>
  );
};

function formatLastSync(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}