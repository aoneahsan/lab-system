import { Network } from '@capacitor/network';
import { offlineDbService } from './offline-db.service';
import { logger } from '@/services/logger.service';

export interface OfflineAwareOptions {
  collection: string;
  tenantId: string;
  operation: 'create' | 'read' | 'update' | 'delete';
  data?: any;
  id?: string;
  filters?: any;
  onlineHandler: () => Promise<any>;
}

class OfflineAwareService {
  // Execute operation with offline support
  async execute(options: OfflineAwareOptions): Promise<any> {
    const { collection, tenantId, operation, data, id, filters, onlineHandler } = options;

    // Check if offline support is available
    if (!offlineDbService.isOfflineSupported()) {
      // Fallback to online-only mode
      return onlineHandler();
    }

    // Check network status
    const networkStatus = await Network.getStatus();
    const isOnline = networkStatus.connected;

    switch (operation) {
      case 'create':
        return this.handleCreate(collection, tenantId, data, isOnline, onlineHandler);

      case 'read':
        return this.handleRead(collection, tenantId, id, filters, isOnline, onlineHandler);

      case 'update':
        return this.handleUpdate(collection, tenantId, id!, data, isOnline, onlineHandler);

      case 'delete':
        return this.handleDelete(collection, tenantId, id!, isOnline, onlineHandler);

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  // Handle create operation
  private async handleCreate(
    collection: string,
    tenantId: string,
    data: any,
    isOnline: boolean,
    onlineHandler: () => Promise<any>
  ): Promise<any> {
    if (isOnline) {
      try {
        // Try online first
        const result = await onlineHandler();

        // Cache the created item
        await offlineDbService.cacheData(collection, tenantId, [result]);

        return result;
      } catch (error) {
        logger.error('Online create failed, queuing for offline sync:', error);
        // Fall through to offline handling
      }
    }

    // Queue for offline sync
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineData = {
      ...data,
      id: offlineId,
      _isOffline: true,
      _createdOffline: Date.now(),
    };

    await offlineDbService.queueOperation(collection, 'create', offlineData);
    await offlineDbService.cacheData(collection, tenantId, [offlineData]);

    return offlineData;
  }

  // Handle read operation
  private async handleRead(
    collection: string,
    tenantId: string,
    id: string | undefined,
    filters: any,
    isOnline: boolean,
    onlineHandler: () => Promise<any>
  ): Promise<any> {
    if (isOnline) {
      try {
        // Try online first
        const result = await onlineHandler();

        // Cache the results
        if (Array.isArray(result)) {
          await offlineDbService.cacheData(collection, tenantId, result);
        } else if (result && id) {
          await offlineDbService.cacheData(collection, tenantId, [result]);
        }

        return result;
      } catch (error) {
        logger.error('Online read failed, using cached data:', error);
        // Fall through to offline handling
      }
    }

    // Use cached data
    if (id) {
      return await offlineDbService.getCachedRecord(collection, id);
    } else {
      return await offlineDbService.getCachedData(collection, tenantId, filters);
    }
  }

  // Handle update operation
  private async handleUpdate(
    collection: string,
    tenantId: string,
    id: string,
    updates: any,
    isOnline: boolean,
    onlineHandler: () => Promise<any>
  ): Promise<void> {
    if (isOnline) {
      try {
        // Try online first
        await onlineHandler();

        // Update cached record
        await offlineDbService.updateCachedRecord(collection, id, updates);

        return;
      } catch (error) {
        logger.error('Online update failed, queuing for offline sync:', error);
        // Fall through to offline handling
      }
    }

    // Queue for offline sync
    await offlineDbService.queueOperation(collection, 'update', { id, ...updates });

    // Update cached record
    await offlineDbService.updateCachedRecord(collection, id, updates);
  }

  // Handle delete operation
  private async handleDelete(
    collection: string,
    tenantId: string,
    id: string,
    isOnline: boolean,
    onlineHandler: () => Promise<any>
  ): Promise<void> {
    if (isOnline) {
      try {
        // Try online first
        await onlineHandler();

        // Remove from cache (implementation needed in offlineDbService)
        // For now, mark as deleted in cache
        await offlineDbService.updateCachedRecord(collection, id, {
          _deleted: true,
          _deletedAt: Date.now(),
        });

        return;
      } catch (error) {
        logger.error('Online delete failed, queuing for offline sync:', error);
        // Fall through to offline handling
      }
    }

    // Queue for offline sync
    await offlineDbService.queueOperation(collection, 'delete', { id });

    // Mark as deleted in cache
    await offlineDbService.updateCachedRecord(collection, id, {
      _deleted: true,
      _deletedAt: Date.now(),
    });
  }

  // Batch operations with offline support
  async executeBatch(operations: OfflineAwareOptions[]): Promise<any[]> {
    const results: any[] = [];

    for (const operation of operations) {
      try {
        const result = await this.execute(operation);
        results.push(result);
      } catch (error) {
        logger.error('Batch operation failed:', error);
        results.push({ error: error });
      }
    }

    return results;
  }

  // Check if data needs sync
  async needsSync(collection: string, id: string): Promise<boolean> {
    const record = await offlineDbService.getCachedRecord(collection, id);
    return record?._isOffline === true;
  }

  // Get sync status for a collection
  async getCollectionSyncStatus(collection: string): Promise<{
    lastSync: number;
    recordCount: number;
    pendingOperations: number;
  }> {
    const metadata = await offlineDbService.getMetadata();
    const collectionMeta = metadata.collections[collection] || {
      lastFetch: 0,
      recordCount: 0,
    };

    const pendingOps = await offlineDbService.getPendingOperations();
    const pendingForCollection = pendingOps.filter((op) => op.collection === collection).length;

    return {
      lastSync: collectionMeta.lastFetch,
      recordCount: collectionMeta.recordCount,
      pendingOperations: pendingForCollection,
    };
  }
}

export const offlineAwareService = new OfflineAwareService();
