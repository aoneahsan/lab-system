import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultService } from '@/services/result.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import { Timestamp } from 'firebase/firestore';
import { logger } from '@/services/logger.service';
import type {
  TestResult,
  ResultFilter,
  ResultEntryFormData,
  BatchResultEntryData,
  // ResultGroup,
} from '@/types/result.types';

// Query keys
const RESULT_KEYS = {
  all: ['results'] as const,
  lists: () => [...RESULT_KEYS.all, 'list'] as const,
  list: (filter?: ResultFilter) => [...RESULT_KEYS.lists(), filter] as const,
  details: () => [...RESULT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RESULT_KEYS.details(), id] as const,
  groups: () => [...RESULT_KEYS.all, 'groups'] as const,
  group: (orderId: string) => [...RESULT_KEYS.groups(), orderId] as const,
  statistics: () => [...RESULT_KEYS.all, 'statistics'] as const,
};

// Get results
export const useResults = (filter?: ResultFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: RESULT_KEYS.list(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return resultService.getResults(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

// Get single result
export const useResult = (resultId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: RESULT_KEYS.detail(resultId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return resultService.getResult(currentTenant.id, resultId);
    },
    enabled: !!currentTenant && !!resultId,
  });
};

// Create result
export const useCreateResult = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: ResultEntryFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      
      // Transform ResultEntryFormData to TestResult format
      const results = await Promise.all(
        data.tests.map(test => 
          resultService.createResult(currentTenant.id, currentUser.id, {
            orderId: data.orderId,
            sampleId: data.sampleId,
            patientId: '', // This should be fetched from the order
            testId: test.testId,
            testName: test.testName,
            category: '', // This should be fetched from the test
            value: test.value,
            unit: test.unit,
            flag: test.flag,
            status: 'entered' as const,
            enteredBy: currentUser.id,
            enteredAt: Timestamp.now(),
            comments: test.comments,
          })
        )
      );
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.statistics() });
      toast.success('Result created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create result');
      logger.error('Error creating result:', error);
    },
  });
};

// Create batch results
export const useCreateBatchResults = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: BatchResultEntryData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return resultService.createBatchResults(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.statistics() });
      toast.success('Results created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create results');
      logger.error('Error creating results:', error);
    },
  });
};

// Update result
export const useUpdateResult = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ resultId, data }: { resultId: string; data: Partial<TestResult> }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return resultService.updateResult(currentTenant.id, currentUser.id, resultId, data);
    },
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.detail(resultId) });
      toast.success('Result updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update result');
      logger.error('Error updating result:', error);
    },
  });
};

// Verify result
export const useVerifyResult = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ resultId, comments: _comments }: { resultId: string; comments?: string }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return resultService.verifyResult(currentTenant.id, currentUser.id, resultId);
    },
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.detail(resultId) });
      toast.success('Result verified');
    },
    onError: (error) => {
      toast.error('Failed to verify result');
      logger.error('Error verifying result:', error);
    },
  });
};

// Approve result
export const useApproveResult = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ resultId, comments }: { resultId: string; comments?: string }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return resultService.approveResult(currentTenant.id, currentUser.id, resultId, comments);
    },
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.detail(resultId) });
      toast.success('Result approved');
    },
    onError: (error) => {
      toast.error('Failed to approve result');
      logger.error('Error approving result:', error);
    },
  });
};

// Reject result
export const useRejectResult = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ resultId, reason }: { resultId: string; reason: string }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return resultService.rejectResult(currentTenant.id, currentUser.id, resultId, reason);
    },
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.detail(resultId) });
      toast.success('Result rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject result');
      logger.error('Error rejecting result:', error);
    },
  });
};

// Delete result
export const useDeleteResult = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (resultId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return resultService.deleteResult(currentTenant.id, resultId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.statistics() });
      toast.success('Result deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete result');
      logger.error('Error deleting result:', error);
    },
  });
};

// Get result groups
export const useResultGroups = (orderId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: RESULT_KEYS.group(orderId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return resultService.getResultGroups(currentTenant.id, orderId);
    },
    enabled: !!currentTenant && !!orderId,
  });
};

// Create result report
export const useCreateResultReport = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ orderId, resultIds }: { orderId: string; resultIds: string[] }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return resultService.createResultReport(currentTenant.id, currentUser.id, orderId, resultIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.lists() });
      toast.success('Report created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create report');
      logger.error('Error creating report:', error);
    },
  });
};

// Get result statistics
export const useResultStatistics = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: RESULT_KEYS.statistics(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return resultService.getResultStatistics(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};
