// Mock offline database service
// TODO: Replace with proper offline database implementation

export const offlineDatabase = {
  isAvailable: () => false,

  async getCachedData(collection: string): Promise<any[]> {
    return [];
  },

  async cacheData(collection: string, id: string, data: any): Promise<void> {
    // Mock implementation
  },

  async updateDocument(collection: string, id: string, data: any, metadata?: any): Promise<void> {
    // Mock implementation
  },

  async deleteDocument(collection: string, id: string): Promise<void> {
    // Mock implementation
  },

  async getDocuments(collection: string): Promise<any[]> {
    return [];
  },

  async clearCollection(collection: string): Promise<void> {
    // Mock implementation
  },

  async initialize(): Promise<void> {
    // Mock implementation
  },

  async getQueuedOperations(): Promise<any[]> {
    return [];
  },

  async queueOperation(operation: any): Promise<void> {
    // Mock implementation
  },

  async removeQueuedOperation(id: string): Promise<void> {
    // Mock implementation
  },

  async getCollections(): Promise<string[]> {
    return [];
  },

  async getLastSyncTime(collection: string): Promise<number | null> {
    return null;
  },

  async setLastSyncTime(collection: string, timestamp: number): Promise<void> {
    // Mock implementation
  },

  async clearAllData(): Promise<void> {
    // Mock implementation
  },

  async getUnsynced(): Promise<any[]> {
    return [];
  },

  async markSynced(id: string): Promise<void> {
    // Mock implementation
  },

  async markSyncError(id: string, error: any): Promise<void> {
    // Mock implementation
  },

  async updateSyncMetadata(collection: string, metadata: any): Promise<void> {
    // Mock implementation
  },

  async getSyncMetadata(collection?: string): Promise<any> {
    return {};
  },

  async close(): Promise<void> {
    // Mock implementation
  }
};