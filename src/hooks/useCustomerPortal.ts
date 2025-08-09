import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalService } from '@/services/customer-portal.service';
import type {
  CustomerPortalAccess,
  CustomerRegistrationData,
  ShareResultData,
  PrescriptionUploadData
} from '@/types/customer-portal.types';
import { toast } from 'react-hot-toast';

// Query keys
const queryKeys = {
  portalAccess: (patientId: string) => ['portal-access', patientId] as const,
  sharedResult: (token: string) => ['shared-result', token] as const,
  prescriptions: (patientId: string) => ['prescriptions', patientId] as const,
  notifications: (patientId: string) => ['portal-notifications', patientId] as const,
  dashboard: (patientId: string) => ['portal-dashboard', patientId] as const
};

// Portal Access
export function usePortalAccess(patientId: string) {
  return useQuery({
    queryKey: queryKeys.portalAccess(patientId),
    queryFn: () => customerPortalService.getPortalAccess(patientId),
    enabled: !!patientId
  });
}

export function useCreatePortalAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CustomerRegistrationData) => 
      customerPortalService.createPortalAccess(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.portalAccess(variables.patientId) 
      });
      toast.success('Portal access created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create portal access');
    }
  });
}

export function useUpdatePortalAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerPortalAccess> }) => 
      customerPortalService.updatePortalAccess(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-access'] });
      toast.success('Portal settings updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    }
  });
}

// Result Sharing
export function useShareResult() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ShareResultData) => 
      customerPortalService.shareResult(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-results'] });
      toast.success('Result shared successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to share result');
    }
  });
}

export function useSharedResult(accessToken: string) {
  return useQuery({
    queryKey: queryKeys.sharedResult(accessToken),
    queryFn: () => customerPortalService.getSharedResult(accessToken),
    enabled: !!accessToken,
    retry: false
  });
}

// Prescriptions
export function usePrescriptions(patientId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions(patientId),
    queryFn: () => customerPortalService.getPrescriptions(patientId),
    enabled: !!patientId
  });
}

export function useUploadPrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ patientId, data }: { 
      patientId: string; 
      data: PrescriptionUploadData 
    }) => customerPortalService.uploadPrescription(patientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.prescriptions(variables.patientId) 
      });
      toast.success('Prescription uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload prescription');
    }
  });
}

// Notifications
export function usePortalNotifications(patientId: string) {
  return useQuery({
    queryKey: queryKeys.notifications(patientId),
    queryFn: () => customerPortalService.getNotifications(patientId),
    enabled: !!patientId
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      customerPortalService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-notifications'] });
    }
  });
}

// Dashboard
export function usePortalDashboard(patientId: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(patientId),
    queryFn: () => customerPortalService.getPortalDashboard(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}