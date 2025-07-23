import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '@/services/patient.service';
import { useAuthStore } from '@stores/auth.store';
import { useTenant } from '@hooks/useTenant';
import { useToast } from '@hooks/useToast';
import type {
  CreatePatientData,
  UpdatePatientData,
  PatientSearchFilters,
} from '@/types/patient.types';

export const usePatients = (filters: PatientSearchFilters = {}, pageSize = 20) => {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['patients', currentTenant?.id, filters, pageSize],
    queryFn: () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      return patientService.searchPatients(currentTenant.id, filters, pageSize);
    },
    enabled: !!currentTenant?.id,
  });
};

export const usePatient = (patientId: string) => {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['patient', currentTenant?.id, patientId],
    queryFn: () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      return patientService.getPatient(currentTenant.id, patientId);
    },
    enabled: !!currentTenant?.id && !!patientId,
  });
};

export const usePatientStats = () => {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['patientStats', currentTenant?.id],
    queryFn: () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      return patientService.getPatientStats(currentTenant.id);
    },
    enabled: !!currentTenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  const { currentTenant } = useTenant();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: (data: CreatePatientData) => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      if (!currentUser?.id) throw new Error('No user logged in');
      
      return patientService.createPatient(currentTenant.id, data, currentUser.id);
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients', currentTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['patientStats', currentTenant?.id] });
      queryClient.setQueryData(['patient', currentTenant?.id, patient.id], patient);
      
      showToast({
        type: 'success',
        title: 'Patient Created',
        message: `Successfully created patient ${patient.firstName} ${patient.lastName}`,
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: error instanceof Error ? error.message : 'Failed to create patient',
      });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  const { currentTenant } = useTenant();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: UpdatePatientData }) => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      if (!currentUser?.id) throw new Error('No user logged in');
      
      return patientService.updatePatient(currentTenant.id, patientId, {
        ...data,
        updatedBy: currentUser.id,
      });
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients', currentTenant?.id] });
      queryClient.setQueryData(['patient', currentTenant?.id, patient.id], patient);
      
      showToast({
        type: 'success',
        title: 'Patient Updated',
        message: 'Patient information updated successfully',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update patient',
      });
    },
  });
};

export const useDeactivatePatient = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  const { currentTenant } = useTenant();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: (patientId: string) => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      if (!currentUser?.id) throw new Error('No user logged in');
      
      return patientService.deactivatePatient(currentTenant.id, patientId, currentUser.id);
    },
    onSuccess: (_, patientId) => {
      queryClient.invalidateQueries({ queryKey: ['patients', currentTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['patient', currentTenant?.id, patientId] });
      
      showToast({
        type: 'success',
        title: 'Patient Deactivated',
        message: 'Patient has been deactivated successfully',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Deactivation Failed',
        message: error instanceof Error ? error.message : 'Failed to deactivate patient',
      });
    },
  });
};

export const useActivatePatient = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();
  const { currentTenant } = useTenant();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: (patientId: string) => {
      if (!currentTenant?.id) throw new Error('No tenant selected');
      if (!currentUser?.id) throw new Error('No user logged in');
      
      return patientService.activatePatient(currentTenant.id, patientId, currentUser.id);
    },
    onSuccess: (_, patientId) => {
      queryClient.invalidateQueries({ queryKey: ['patients', currentTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['patient', currentTenant?.id, patientId] });
      
      showToast({
        type: 'success',
        title: 'Patient Activated',
        message: 'Patient has been activated successfully',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Activation Failed',
        message: error instanceof Error ? error.message : 'Failed to activate patient',
      });
    },
  });
};