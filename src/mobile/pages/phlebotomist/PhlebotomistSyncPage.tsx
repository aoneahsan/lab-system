import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Cloud,
  CloudOff,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Upload,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Network } from '@capacitor/network';
import { useOfflineStore } from '@/mobile/stores/offline.store';
import { modalService } from '@/services/modal.service';
import { toast } from '@/hooks/useToast';

interface SyncStats {
  totalPending: number;
  syncing: number;
  synced: number;
  failed: number;
}

const PhlebotomistSyncPage: React.FC = () => {
  const { collections, pendingSync, isOnline, lastSyncTime, syncCollections, removeCollection } =
    useOfflineStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const syncStats: SyncStats = {
    totalPending: collections.filter((c) => c.syncStatus === 'pending').length,
    syncing: collections.filter((c) => c.syncStatus === 'syncing').length,
    synced: collections.filter((c) => c.syncStatus === 'synced').length,
    failed: collections.filter((c) => c.syncStatus === 'failed').length,
  };

  useEffect(() => {
    const checkNetworkStatus = async () => {
    const status = await Network.getStatus();
    if (!status.connected && pendingSync > 0) {
      toast.info('You are offline. Collections will sync when connection is restored.');
    }
    };
    
    checkNetworkStatus();
  }, [pendingSync, isOnline]);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      await syncCollections();

      clearInterval(progressInterval);
      setSyncProgress(100);

      toast.success('Sync completed successfully');

      // Reset progress after a delay
      setTimeout(() => {
        setSyncProgress(0);
        setIsSyncing(false);
      }, 1000);
    } catch (_error) {
      setIsSyncing(false);
      setSyncProgress(0);
      toast.error('Sync failed. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCollections.length === 0) return;

    const confirmDelete = await modalService.confirmDanger({
      title: 'Delete Collections',
      message: `Are you sure you want to delete ${selectedCollections.length} collection(s)?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmDelete) {
      selectedCollections.forEach((id) => removeCollection(id));
      setSelectedCollections([]);
      toast.success(`Deleted ${selectedCollections.length} collection(s)`);
    }
  };

  const toggleSelectCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCollections.length === collections.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(collections.map((c) => c.id));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sync Center</h1>

        {/* Connection Status */}
        <div
          className={`rounded-lg p-4 flex items-center justify-between ${
            isOnline ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Connected</p>
                  <p className="text-sm text-green-700">Ready to sync</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Offline</p>
                  <p className="text-sm text-red-700">Sync will resume when online</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={!isOnline || isSyncing || syncStats.totalPending === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Cloud className="h-4 w-4" />
            Sync Now
          </button>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Syncing collections...</p>
              <p className="text-sm text-gray-600">{syncProgress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sync Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Upload className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{syncStats.totalPending}</p>
            <p className="text-sm text-gray-600">Pending Upload</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{syncStats.synced}</p>
            <p className="text-sm text-gray-600">Synced</p>
          </div>
        </div>

        {lastSyncTime && (
          <p className="text-sm text-gray-600 text-center mt-4">
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </p>
        )}
      </div>

      {/* Collection List */}
      {collections.length > 0 && (
        <div className="flex-1 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Collections</h3>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700">
                {selectedCollections.length === collections.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedCollections.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedCollections.length})
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className={`bg-white rounded-lg shadow-sm p-4 ${
                  selectedCollections.includes(collection.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => toggleSelectCollection(collection.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{collection.patientName}</p>
                        {getStatusIcon(collection.syncStatus)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Order: {collection.orderId} • {collection.tests.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Collected: {new Date(collection.collectedAt).toLocaleString()}
                      </p>
                      {collection.syncError && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                          {collection.syncError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {collections.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <CloudOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections to sync</h3>
            <p className="text-sm text-gray-600">All your collections are up to date</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebotomistSyncPage;
