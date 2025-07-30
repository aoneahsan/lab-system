import { Capacitor } from '@capacitor/core';
import { OfflineDbWebService } from './offline-db-web.service';
import { OfflineDbNativeService } from './offline-db-native.service';

export interface OfflineQueueItem {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface OfflineMetadata {
  lastSyncTime: number;
  pendingChanges: number;
  collections: Record<
    string,
    {
      lastFetch: number;
      recordCount: number;
    }
  >;
}

// Interface for offline database implementations
interface IOfflineDbService {
  initialize(): Promise<void>;
  queueOperation(collection: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void>;
  getPendingOperations(): Promise<OfflineQueueItem[]>;
  markAsSynced(id: string): Promise<void>;
  updateRetryInfo(id: string, error: string): Promise<void>;
  cacheData(collection: string, tenantId: string, data: any[]): Promise<void>;
  getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]>;
  getCachedRecord(collection: string, id: string): Promise<any | null>;
  updateCachedRecord(collection: string, id: string, updates: any): Promise<void>;
  getMetadata(): Promise<OfflineMetadata>;
  updateMetadata(updates: Partial<OfflineMetadata>): Promise<void>;
  clearOfflineData(): Promise<void>;
  close(): Promise<void>;
  isOfflineSupported(): boolean;
}

// Facade class that delegates to appropriate implementation
class OfflineDbService implements IOfflineDbService {
  private implementation: IOfflineDbService;

  constructor() {
    // Choose implementation based on platform
    if (Capacitor.isNativePlatform()) {
      this.implementation = new OfflineDbNativeService();
    } else {
      this.implementation = new OfflineDbWebService();
    }
  }

  async initialize(): Promise<void> {
    return this.implementation.initialize();
  }

  async queueOperation(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    return this.implementation.queueOperation(collection, operation, data);
  }

  async getPendingOperations(): Promise<OfflineQueueItem[]> {
    return this.implementation.getPendingOperations();
  }

  async markAsSynced(id: string): Promise<void> {
    return this.implementation.markAsSynced(id);
  }

  async updateRetryInfo(id: string, error: string): Promise<void> {
    return this.implementation.updateRetryInfo(id, error);
  }

  async cacheData(collection: string, tenantId: string, data: any[]): Promise<void> {
    return this.implementation.cacheData(collection, tenantId, data);
  }

  async getCachedData(collection: string, tenantId: string, filters?: any): Promise<any[]> {
    return this.implementation.getCachedData(collection, tenantId, filters);
  }

  async getCachedRecord(collection: string, id: string): Promise<any | null> {
    return this.implementation.getCachedRecord(collection, id);
  }

  async updateCachedRecord(collection: string, id: string, updates: any): Promise<void> {
    return this.implementation.updateCachedRecord(collection, id, updates);
  }

  async getMetadata(): Promise<OfflineMetadata> {
    return this.implementation.getMetadata();
  }

  async updateMetadata(updates: Partial<OfflineMetadata>): Promise<void> {
    return this.implementation.updateMetadata(updates);
  }

  async clearOfflineData(): Promise<void> {
    return this.implementation.clearOfflineData();
  }

  async close(): Promise<void> {
    return this.implementation.close();
  }

  isOfflineSupported(): boolean {
    return this.implementation.isOfflineSupported();
  }
}

export const offlineDbService = new OfflineDbService();