import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times with exponential backoff
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Performance optimization: Batch query notifications
queryClient.setMutationDefaults(['createPatient', 'updatePatient', 'deletePatient'], {
  mutationFn: async (variables: any) => {
    // Mutation logic here
    return variables;
  },
  onSuccess: () => {
    // Batch invalidations
    queryClient.invalidateQueries({ 
      queryKey: ['patients'],
      exact: false,
    });
  },
});

// Prefetch commonly used queries
export const prefetchCommonQueries = async () => {
  const commonQueries = [
    { queryKey: ['currentUser'] },
    { queryKey: ['tests'] },
    { queryKey: ['dashboardStats'] },
  ];

  await Promise.all(
    commonQueries.map(query => 
      queryClient.prefetchQuery({
        ...query,
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    )
  );
};

// Garbage collection for old queries
export const cleanupStaleQueries = () => {
  const now = Date.now();
  const queries = queryClient.getQueryCache().getAll();
  
  queries.forEach(query => {
    const { state, queryKey } = query;
    
    // Remove queries older than 30 minutes that aren't being observed
    if (
      state.dataUpdatedAt < now - 30 * 60 * 1000 &&
      query.getObserversCount() === 0
    ) {
      queryClient.removeQueries({ queryKey });
    }
  });
};

// Set up periodic cleanup
setInterval(cleanupStaleQueries, 5 * 60 * 1000); // Every 5 minutes