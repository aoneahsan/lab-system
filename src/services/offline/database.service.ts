// Mock offline database service
// TODO: Replace with proper offline database implementation

export const offlineDatabase = {
  isAvailable: () => false,

  async getCachedData(_collection: string): Promise<any[]> {
    return [];
  },

  async cacheData(_collection: string, _id: string, _data: any): Promise<void> {
    // Mock implementation
  },

  async updateDocument(_collection: string, _id: string, _data: any, _metadata?: any): Promise<void> {
    // Mock implementation
  },

  async deleteDocument(_collection: string, _id: string): Promise<void> {
    // Mock implementation
  },

  async getDocuments(_collection: string): Promise<any[]> {
    return [];
  },

  async clearCollection(_collection: string): Promise<void> {
    // Mock implementation
  },

  async initialize(): Promise<void> {
    // Mock implementation
  },

  async getQueuedOperations(): Promise<any[]> {
    return [];
  },

  async queueOperation(_operation: any): Promise<void> {
    // Mock implementation
  },

  async removeQueuedOperation(_id: string): Promise<void> {
    // Mock implementation
  },

  async getCollections(): Promise<string[]> {
    return [];
  },

  async getLastSyncTime(_collection: string): Promise<number | null> {
    return null;
  },

  async setLastSyncTime(_collection: string, _timestamp: number): Promise<void> {
    // Mock implementation
  },

  async clearAllData(): Promise<void> {
    // Mock implementation
  },

  async getUnsynced(): Promise<any[]> {
    return [];
  },

  async markSynced(_id: string): Promise<void> {
    // Mock implementation
  },

  async markSyncError(_id: string, _error: any): Promise<void> {
    // Mock implementation
  },

  async updateSyncMetadata(_collection: string, _metadata: any): Promise<void> {
    // Mock implementation
  },

  async getSyncMetadata(_collection?: string): Promise<any> {
    return {};
  },

  async close(): Promise<void> {
    // Mock implementation
  }
};