import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sampleService } from '@/services/sample.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import type {
  Sample,
  SampleCollection,
  SampleFilter,
  SampleFormData,
  SampleStatus,
} from '@/types/sample.types';

// Query keys
const SAMPLE_KEYS = {
  all: ['samples'] as const,
  lists: () => [...SAMPLE_KEYS.all, 'list'] as const,
  list: (filter?: SampleFilter) => [...SAMPLE_KEYS.lists(), filter] as const,
  details: () => [...SAMPLE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SAMPLE_KEYS.details(), id] as const,
  statistics: () => [...SAMPLE_KEYS.all, 'statistics'] as const,
  collections: () => [...SAMPLE_KEYS.all, 'collections'] as const,
  collection: (filter?: { status?: string; phlebotomistId?: string }) => [...SAMPLE_KEYS.collections(), filter] as const,
};

// Get samples
export const useSamples = (filter?: SampleFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: SAMPLE_KEYS.list(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return sampleService.getSamples(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

// Get single sample
export const useSample = (sampleId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: SAMPLE_KEYS.detail(sampleId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return sampleService.getSample(currentTenant.id, sampleId);
    },
    enabled: !!currentTenant && !!sampleId,
  });
};

// Create sample
export const useCreateSample = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: SampleFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return sampleService.createSample(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.statistics() });
      toast.success('Sample created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create sample');
      console.error('Error creating sample:', error);
    },
  });
};

// Update sample
export const useUpdateSample = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ sampleId, data }: { sampleId: string; data: Partial<SampleFormData> }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return sampleService.updateSample(currentTenant.id, currentUser.id, sampleId, data);
    },
    onSuccess: (_, { sampleId }) => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.detail(sampleId) });
      toast.success('Sample updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update sample');
      console.error('Error updating sample:', error);
    },
  });
};

// Update sample status
export const useUpdateSampleStatus = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      sampleId,
      status,
      notes,
      location,
    }: {
      sampleId: string;
      status: SampleStatus;
      notes?: string;
      location?: string;
    }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return sampleService.updateSampleStatus(
        currentTenant.id,
        currentUser.id,
        sampleId,
        status,
        notes,
        location
      );
    },
    onSuccess: (_, { sampleId }) => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.detail(sampleId) });
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.statistics() });
      toast.success('Sample status updated');
    },
    onError: (error) => {
      toast.error('Failed to update sample status');
      console.error('Error updating sample status:', error);
    },
  });
};

// Delete sample
export const useDeleteSample = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (sampleId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return sampleService.deleteSample(currentTenant.id, sampleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.statistics() });
      toast.success('Sample deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete sample');
      console.error('Error deleting sample:', error);
    },
  });
};

// Get sample collections
export const useSampleCollections = (filter?: { status?: string; phlebotomistId?: string }) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: SAMPLE_KEYS.collection(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return sampleService.getSampleCollections(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

// Create sample collection
export const useCreateSampleCollection = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (
      data: Omit<SampleCollection, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
    ) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return sampleService.createSampleCollection(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.collections() });
      toast.success('Sample collection created');
    },
    onError: (error) => {
      toast.error('Failed to create sample collection');
      console.error('Error creating sample collection:', error);
    },
  });
};

// Complete sample collection
export const useCompleteSampleCollection = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      collectionId,
      collectedSamples,
    }: {
      collectionId: string;
      collectedSamples: { testId: string; sampleId: string }[];
    }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return sampleService.completeSampleCollection(
        currentTenant.id,
        currentUser.id,
        collectionId,
        collectedSamples
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.collections() });
      toast.success('Sample collection completed');
    },
    onError: (error) => {
      toast.error('Failed to complete sample collection');
      console.error('Error completing sample collection:', error);
    },
  });
};

// Batch update samples
export const useBatchUpdateSamples = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      sampleIds,
      updates,
    }: {
      sampleIds: string[];
      updates: Partial<Sample>;
    }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return sampleService.batchUpdateSamples(currentTenant.id, currentUser.id, sampleIds, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.statistics() });
      toast.success('Samples updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update samples');
      console.error('Error updating samples:', error);
    },
  });
};

// Get sample statistics
export const useSampleStatistics = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: SAMPLE_KEYS.statistics(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return sampleService.getSampleStatistics(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};