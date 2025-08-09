import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeCollectionService } from '@/services/home-collection.service';
import type {
  HomeCollection,
  HomeCollectionFilters,
  HomeCollectionFormData,
  RouteAssignmentData,
  PhlebotomistLocation
} from '@/types/home-collection.types';
import { toast } from 'react-hot-toast';

// Query keys
const queryKeys = {
  all: ['homeCollections'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: HomeCollectionFilters) => [...queryKeys.lists(), filters] as const,
  detail: (id: string) => [...queryKeys.all, 'detail', id] as const,
  routes: ['collectionRoutes'] as const,
  routesList: () => [...queryKeys.routes, 'list'] as const,
  routeDetail: (id: string) => [...queryKeys.routes, 'detail', id] as const,
  kits: ['collectionKits'] as const,
  availableKits: () => [...queryKeys.kits, 'available'] as const,
  locations: ['phlebotomistLocations'] as const,
  location: (id: string) => [...queryKeys.locations, id] as const
};

// Home Collections
export function useHomeCollections(filters: HomeCollectionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: () => homeCollectionService.getHomeCollections(filters),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useHomeCollection(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => homeCollectionService.getHomeCollection(id),
    enabled: !!id
  });
}

export function useCreateHomeCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: HomeCollectionFormData) => 
      homeCollectionService.createHomeCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      toast.success('Home collection scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule home collection');
    }
  });
}

export function useUpdateHomeCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HomeCollection> }) => 
      homeCollectionService.updateHomeCollection(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      toast.success('Home collection updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update home collection');
    }
  });
}

// Routes
export function useCollectionRoutes(phlebotomistId?: string, date?: Date) {
  return useQuery({
    queryKey: [...queryKeys.routesList(), phlebotomistId, date],
    queryFn: () => homeCollectionService.getRoutes(phlebotomistId, date),
    staleTime: 5 * 60 * 1000
  });
}

export function useCollectionRoute(id: string) {
  return useQuery({
    queryKey: queryKeys.routeDetail(id),
    queryFn: () => homeCollectionService.getRoute(id),
    enabled: !!id
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RouteAssignmentData) => 
      homeCollectionService.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routesList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      toast.success('Route created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create route');
    }
  });
}

// Kits
export function useAvailableKits() {
  return useQuery({
    queryKey: queryKeys.availableKits(),
    queryFn: () => homeCollectionService.getAvailableKits(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}

export function useAssignKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ kitId, phlebotomistId, routeId }: { 
      kitId: string; 
      phlebotomistId: string; 
      routeId: string 
    }) => homeCollectionService.assignKit(kitId, phlebotomistId, routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availableKits() });
      toast.success('Kit assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign kit');
    }
  });
}

export function useReturnKit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (kitId: string) => homeCollectionService.returnKit(kitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availableKits() });
      toast.success('Kit returned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to return kit');
    }
  });
}

// Location Tracking
export function usePhlebotomistLocation(phlebotomistId: string) {
  return useQuery({
    queryKey: queryKeys.location(phlebotomistId),
    queryFn: () => homeCollectionService.getPhlebotomistLocation(phlebotomistId),
    enabled: !!phlebotomistId,
    refetchInterval: 30 * 1000 // Refresh every 30 seconds
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      phlebotomistId, 
      coordinates, 
      status, 
      currentCollectionId 
    }: {
      phlebotomistId: string;
      coordinates: { latitude: number; longitude: number };
      status: PhlebotomistLocation['status'];
      currentCollectionId?: string;
    }) => homeCollectionService.updatePhlebotomistLocation(
      phlebotomistId, 
      coordinates, 
      status, 
      currentCollectionId
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.location(variables.phlebotomistId) 
      });
    }
  });
}

// Status Updates
export function useUpdateCollectionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      collectionId, 
      status, 
      notes 
    }: {
      collectionId: string;
      status: HomeCollection['status'];
      notes?: string;
    }) => homeCollectionService.updateCollectionStatus(collectionId, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.detail(variables.collectionId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    }
  });
}

// Sample Collection
export function useRecordSampleCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      collectionId, 
      samples 
    }: {
      collectionId: string;
      samples: Array<{ sampleId: string; tubeType: string }>;
    }) => homeCollectionService.recordSampleCollection(collectionId, samples),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.detail(variables.collectionId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      toast.success('Samples collected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record sample collection');
    }
  });
}

// Payment
export function useRecordPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      collectionId, 
      amount, 
      paymentMethod 
    }: {
      collectionId: string;
      amount: number;
      paymentMethod: HomeCollection['paymentMethod'];
    }) => homeCollectionService.recordPayment(collectionId, amount, paymentMethod),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.detail(variables.collectionId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    }
  });
}