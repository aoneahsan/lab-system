import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testService } from '@/services/test.service';
import { loincService } from '@/services/loinc.service';
import { useTenant } from '@/hooks/useTenant';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
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
  const { tenant: currentTenant } = useTenant();

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
  const { tenant: currentTenant } = useTenant();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: TestDefinitionFormData) =>
      testService.createTest(currentTenant!.id, currentUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Test created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create test', error.message);
    },
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ testId, data }: { testId: string; data: Partial<TestDefinitionFormData> }) =>
      testService.updateTest(testId, currentUser!.id, data),
    onSuccess: (_, { testId }) => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['test', testId] });
      toast.success('Test updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update test', error.message);
    },
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => testService.deleteTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Test deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete test', error.message);
    },
  });
};

// Test Panel Hooks
export const useTestPanels = () => {
  const { tenant: currentTenant } = useTenant();

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
  const { tenant: currentTenant } = useTenant();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: (
      data: Omit<
        TestPanel,
        'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
      >
    ) => testService.createTestPanel(currentTenant!.id, currentUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPanels'] });
      toast.success('Test panel created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create test panel', error.message);
    },
  });
};

export const useUpdateTestPanel = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ panelId, data }: { panelId: string; data: Partial<TestPanel> }) =>
      testService.updateTestPanel(panelId, currentUser!.id, data),
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['testPanels'] });
      queryClient.invalidateQueries({ queryKey: ['testPanel', panelId] });
      toast.success('Test panel updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update test panel', error.message);
    },
  });
};

export const useDeleteTestPanel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (panelId: string) => testService.deleteTestPanel(panelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPanels'] });
      toast.success('Test panel deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete test panel', error.message);
    },
  });
};

// Test Order Hooks
export const useTestOrders = (filter?: TestOrderFilter) => {
  const { tenant: currentTenant } = useTenant();

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
  const { tenant: currentTenant } = useTenant();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: TestOrderFormData) => {
      // In a real app, get provider details from user profile
      const providerId = currentUser!.id;
      const providerName = currentUser!.displayName || 'Unknown Provider';

      return testService.createTestOrder(
        currentTenant!.id,
        currentUser!.id,
        providerId,
        providerName,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      toast.success('Test order created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create test order', error.message);
    },
  });
};

export const useApproveTestOrder = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ orderId, notes }: { orderId: string; notes?: string }) =>
      testService.approveTestOrder(orderId, currentUser!.id, notes),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      queryClient.invalidateQueries({ queryKey: ['testOrder', orderId] });
      toast.success('Order approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve order', error.message);
    },
  });
};

export const useRejectTestOrder = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      testService.rejectTestOrder(orderId, currentUser!.id, reason),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      queryClient.invalidateQueries({ queryKey: ['testOrder', orderId] });
      toast.success('Order rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject order', error.message);
    },
  });
};

export const useUpdateTestOrderStatus = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      cancelReason,
    }: {
      orderId: string;
      status: TestOrder['status'];
      cancelReason?: string;
    }) => testService.updateTestOrderStatus(orderId, currentUser!.id, status, cancelReason),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['testOrders'] });
      queryClient.invalidateQueries({ queryKey: ['testOrder', orderId] });
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update order status', error.message);
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
  const { tenant: currentTenant } = useTenant();

  return useQuery({
    queryKey: ['testStatistics', currentTenant?.id],
    queryFn: () => testService.getTestStatistics(currentTenant!.id),
    enabled: !!currentTenant,
  });
};
