import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testService } from '@/services/test.service';
import { loincService } from '@/services/loinc.service';
import { useTenant } from '@/hooks/useTenant';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import type {
  TestDefinitionFormData,
  TestPanel,
  TestOrder,
  TestOrderFormData,
  TestFilter,
  TestOrderFilter,
} from '@/types/test.types';

// Test Definition Hooks
export const useTests = (filter?: TestFilter) => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['tests', currentTenant?.id, filter],
    queryFn: () => testService.getTests(currentTenant!.id, filter),
    enabled: !!currentTenant,
  });
};

export const useTest = (testId: string) => {
  return useQuery({
    queryKey: ['test', testId],
    queryFn: () => testService.getTestById(testId),
    enabled: !!testId,
  });
};

export const useCreateTest = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: (data: TestDefinitionFormData) =>
      testService.createTest(currentTenant!.id, user!.uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      showToast('Test created successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to create test', 'error');
    },
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: ({
      testId,
      data,
    }: {
      testId: string;
      data: Partial<TestDefinitionFormData>;
    }) => testService.updateTest(testId, user!.uid, data),
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['test', testId] });
      showToast('Test updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update test', 'error');
    },
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: (testId: string) => testService.deleteTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      showToast('Test deleted successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to delete test', 'error');
    },
  });
};

// Test Panel Hooks
export const useTestPanels = () => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['testPanels', currentTenant?.id],
    queryFn: () => testService.getTestPanels(currentTenant!.id),
    enabled: !!currentTenant,
  });
};

export const useTestPanel = (panelId: string) => {
  return useQuery({
    queryKey: ['testPanel', panelId],
    queryFn: () => testService.getTestPanelById(panelId),
    enabled: !!panelId,
  });
};

export const useCreateTestPanel = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: (
      data: Omit<TestPanel, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
    ) => testService.createTestPanel(currentTenant!.id, user!.uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPanels'] });
      showToast('Test panel created successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to create test panel', 'error');
    },
  });
};

export const useUpdateTestPanel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: ({
      panelId,
      data,
    }: {
      panelId: string;
      data: Partial<TestPanel>;
    }) => testService.updateTestPanel(panelId, user!.uid, data),
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['testPanels'] });
      queryClient.invalidateQueries({ queryKey: ['testPanel', panelId] });
      showToast('Test panel updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update test panel', 'error');
    },
  });
};

export const useDeleteTestPanel = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: (panelId: string) => testService.deleteTestPanel(panelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPanels'] });
      showToast('Test panel deleted successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to delete test panel', 'error');
    },
  });
};

// Test Order Hooks
export const useTestOrders = (filter?: TestOrderFilter) => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['testOrders', currentTenant?.id, filter],
    queryFn: () => testService.getTestOrders(currentTenant!.id, filter),
    enabled: !!currentTenant,
  });
};

export const useTestOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['testOrder', orderId],
    queryFn: () => testService.getTestOrderById(orderId),
    enabled: !!orderId,
  });
};

export const useCreateTestOrder = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: (data: TestOrderFormData) => {
      // In a real app, get provider details from user profile
      const providerId = user!.uid;
      const providerName = user!.displayName || 'Unknown Provider';
      
      return testService.createTestOrder(
        currentTenant!.id,
        user!.uid,
        providerId,
        providerName,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      showToast('Test order created successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to create test order', 'error');
    },
  });
};

export const useApproveTestOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: ({ orderId, notes }: { orderId: string; notes?: string }) => 
      testService.approveTestOrder(orderId, user!.uid, notes),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      queryClient.invalidateQueries({ queryKey: ['testOrder', orderId] });
      showToast('Order approved successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to approve order', 'error');
    },
  });
};

export const useRejectTestOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => 
      testService.rejectTestOrder(orderId, user!.uid, reason),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      queryClient.invalidateQueries({ queryKey: ['testOrder', orderId] });
      showToast('Order rejected', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to reject order', 'error');
    },
  });
};

export const useUpdateTestOrderStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      cancelReason,
    }: {
      orderId: string;
      status: TestOrder['status'];
      cancelReason?: string;
    }) => testService.updateTestOrderStatus(orderId, user!.uid, status, cancelReason),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      queryClient.invalidateQueries({ queryKey: ['testOrder', orderId] });
      showToast('Order status updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update order status', 'error');
    },
  });
};

// LOINC Hooks
export const useLOINCSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['loincSearch', searchTerm],
    queryFn: () => loincService.searchLOINCCodes(searchTerm),
    enabled: searchTerm.length >= 2,
  });
};

export const useCommonLOINCTests = () => {
  return useQuery({
    queryKey: ['loincCommon'],
    queryFn: () => loincService.getCommonTests(),
  });
};

// Statistics Hook
export const useTestStatistics = () => {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['testStatistics', currentTenant?.id],
    queryFn: () => testService.getTestStatistics(currentTenant!.id),
    enabled: !!currentTenant,
  });
};