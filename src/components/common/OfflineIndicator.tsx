import React from 'react';
import { WifiOff, RefreshCw, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { useOfflineSupport } from '@/hooks/offline/useOfflineSupport';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isOfflineSupported, syncStatus, sync } = useOfflineSupport();

  if (!isOfflineSupported) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Connected to server' : 'Working offline'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Pending Changes */}
        {syncStatus.pendingChanges > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {syncStatus.pendingChanges}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{syncStatus.pendingChanges} changes pending sync</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Sync Button */}
        {isOnline && !syncStatus.isSyncing && syncStatus.pendingChanges > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={sync}
            className="h-7 px-2"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground">
                {formatLastSync(syncStatus.lastSync)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last synced: {syncStatus.lastSync.toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
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