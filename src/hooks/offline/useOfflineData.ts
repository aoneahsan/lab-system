import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineDatabase } from '@/services/offline/database.service';
import { syncService } from '@/services/offline/sync.service';
import { useOfflineSupport } from './useOfflineSupport';

interface UseOfflineDataOptions {
  collection: string;
  queryKey: string[];
  onlineQuery: () => Promise<any>;
  offlineQuery?: () => Promise<any>;
  enableOffline?: boolean;
}

export const useOfflineData = <T extends { id: string } = any>({
  collection,
  queryKey,
  onlineQuery,
  offlineQuery,
  enableOffline = true
}: UseOfflineDataOptions) => {
  const { isOnline, isOfflineSupported } = useOfflineSupport();
  const queryClient = useQueryClient();

  // Main query that switches between online and offline
  const query = useQuery({
    queryKey: [...queryKey, { offline: !isOnline }],
    queryFn: async () => {
      if (!isOnline && isOfflineSupported && enableOffline) {
        // Use offline data
        if (offlineQuery) {
          return await offlineQuery();
        } else {
          // Default offline query using cached data
          return await offlineDatabase.getCachedData(collection);
        }
      } else {
        // Use online data
        const data = await onlineQuery();
        
        // Cache the data if offline support is enabled
        if (isOfflineSupported && enableOffline && Array.isArray(data)) {
          for (const item of data) {
            await offlineDatabase.cacheData(collection, item.id, item);
          }
        }
        
        return data;
      }
    },
    staleTime: !isOnline ? Infinity : 5 * 60 * 1000, // Don't refetch offline data
  });

  return {
    ...query,
    isOffline: !isOnline && isOfflineSupported && enableOffline
  };
};

interface UseOfflineMutationOptions {
  collection: string;
  mutationKey: string[];
  onlineMutation: (variables: any) => Promise<any>;
  offlineMutation?: (variables: any) => Promise<any>;
  operation: 'create' | 'update' | 'delete';
}

export const useOfflineMutation = <TData extends { id: string } = any, TVariables = any>({
  collection,
  mutationKey,
  onlineMutation,
  offlineMutation,
  operation
}: UseOfflineMutationOptions) => {
  const { isOnline, isOfflineSupported } = useOfflineSupport();
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationKey,
    mutationFn: async (variables: any) => {
      if (!isOnline && isOfflineSupported) {
        // Queue for later sync
        const documentId = variables.id || `temp_${Date.now()}`;
        
        await syncService.queueOperation(
          collection,
          documentId,
          operation,
          variables
        );

        // Execute offline mutation if provided
        if (offlineMutation) {
          return await offlineMutation(variables);
        }

        // Return optimistic response
        return { ...variables, id: documentId, _offline: true };
      } else {
        // Execute online mutation
        return await onlineMutation(variables);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: [collection] });
      
      // If offline, update cache
      if (!isOnline && isOfflineSupported) {
        if (operation !== 'delete') {
          offlineDatabase.cacheData(collection, data.id, data);
        }
      }
    }
  });
};