import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientOfflineService } from '@/services/patient-offline.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useOffline } from './useOffline';
import type {
  Patient,
  CreatePatientData,
  UpdatePatientData,
  PatientSearchFilters,
} from '@/types/patient.types';

export const useOfflinePatients = (filters?: PatientSearchFilters) => {
  const { currentTenant } = useTenantStore();
  const { isOffline } = useOffline();
  const tenantId = currentTenant?.id || '';

  return useQuery({
    queryKey: ['patients', tenantId, filters],
    queryFn: () => patientOfflineService.searchPatients(tenantId, filters),
    enabled: !!tenantId,
    staleTime: isOffline ? Infinity : 5 * 60 * 1000, // Don't refetch when offline
    gcTime: isOffline ? Infinity : 10 * 60 * 1000, // Keep data longer when offline
  });
};

export const useOfflinePatient = (patientId: string) => {
  const { currentTenant } = useTenantStore();
  const { isOffline } = useOffline();
  const tenantId = currentTenant?.id || '';

  return useQuery({
    queryKey: ['patient', tenantId, patientId],
    queryFn: () => patientOfflineService.getPatient(tenantId, patientId),
    enabled: !!tenantId && !!patientId,
    staleTime: isOffline ? Infinity : 5 * 60 * 1000,
    gcTime: isOffline ? Infinity : 10 * 60 * 1000,
  });
};

export const useCreateOfflinePatient = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  // const { queueOperation } = useOffline();
  const tenantId = currentTenant?.id || '';

  return useMutation({
    mutationFn: (data: CreatePatientData) => patientOfflineService.createPatient(tenantId, data),
    onSuccess: (newPatient) => {
      // Update the patients list cache
      queryClient.setQueryData<Patient[]>(['patients', tenantId], (old) =>
        old ? [newPatient, ...old] : [newPatient]
      );

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['patients', tenantId] });
    },
    onError: (error: any) => {
      console.error('Failed to create patient:', error);
    },
  });
};

export const useUpdateOfflinePatient = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id || '';

  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: UpdatePatientData }) =>
      patientOfflineService.updatePatient(tenantId, patientId, data),
    onSuccess: (_, { patientId }) => {
      // Invalidate specific patient query
      queryClient.invalidateQueries({ queryKey: ['patient', tenantId, patientId] });
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: ['patients', tenantId] });
    },
    onError: (error: any) => {
      console.error('Failed to update patient:', error);
    },
  });
};

export const useDeleteOfflinePatient = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id || '';

  return useMutation({
    mutationFn: (patientId: string) => patientOfflineService.deletePatient(tenantId, patientId),
    onSuccess: (_, patientId) => {
      // Remove from cache
      queryClient.setQueryData<Patient[]>(
        ['patients', tenantId],
        (old) => old?.filter((p) => p.id !== patientId) || []
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['patient', tenantId, patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients', tenantId] });
    },
    onError: (error: any) => {
      console.error('Failed to delete patient:', error);
    },
  });
};

export const useOfflinePatientStats = () => {
  const { currentTenant } = useTenantStore();
  const { isOffline } = useOffline();
  const tenantId = currentTenant?.id || '';

  return useQuery({
    queryKey: ['patient-stats', tenantId],
    queryFn: () => patientOfflineService.getPatientStats(tenantId),
    enabled: !!tenantId,
    staleTime: isOffline ? Infinity : 10 * 60 * 1000,
    gcTime: isOffline ? Infinity : 30 * 60 * 1000,
  });
};
