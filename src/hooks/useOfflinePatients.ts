import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOffline } from '@/hooks/useOffline';
import { offlineDatabase } from '@/services/offline/database.service';
import { patientService } from '@/services/patient.service';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import type { Patient } from '@/types/patient.types';
import { toast } from 'react-hot-toast';
import { logger } from '@/services/logger.service';

interface OfflinePatientData {
  patients: Patient[];
  lastSyncTime: number | null;
  pendingChanges: number;
}

const QUERY_KEYS = {
  offlinePatients: ['offline', 'patients'],
  patientResults: (patientId: string) => ['offline', 'patient-results', patientId],
} as const;

export function useOfflinePatients() {
  const { isOffline } = useOffline();
  const { currentUser } = useAuthStore();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  // Fetch offline patient data
  const query = useQuery({
    queryKey: QUERY_KEYS.offlinePatients,
    queryFn: async (): Promise<OfflinePatientData> => {
      try {
        const patients = await offlineDatabase.getCachedData('patients') as Patient[];
        const lastSyncTime = await offlineDatabase.getLastSyncTime('patients');
        const unsynced = await offlineDatabase.getUnsynced();
        
        return {
          patients: patients || [],
          lastSyncTime,
          pendingChanges: unsynced.length
        };
      } catch (error) {
        logger.error('Failed to load offline patients:', error);
        return {
          patients: [],
          lastSyncTime: null,
          pendingChanges: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync patients from server
  const syncPatients = useMutation({
    mutationFn: async () => {
      if (!currentUser || !tenant) {
        throw new Error('User not authenticated');
      }

      // Fetch latest patients from server
      const serverPatients = await patientService.getPatients(tenant.id, {});
      
      // Clear existing offline patients
      await offlineDatabase.clearCollection('patients');
      
      // Cache all patients offline
      await Promise.all(
        serverPatients.map(patient => 
          offlineDatabase.cacheData('patients', patient.id, patient)
        )
      );
      
      // Update sync timestamp
      await offlineDatabase.setLastSyncTime('patients', Date.now());
      
      return serverPatients;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.offlinePatients });
      toast.success('Patient data synced successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to sync patient data');
      logger.error('Sync error:', error);
    }
  });

  // Add or update patient offline
  const updatePatientOffline = useMutation({
    mutationFn: async (patient: Patient) => {
      await offlineDatabase.updateDocument('patients', patient.id, patient, {
        synced: isOffline ? false : true
      });
      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.offlinePatients });
    }
  });

  // Get patient by ID (offline-first)
  const getPatientById = async (patientId: string): Promise<Patient | null> => {
    try {
      const patients = await offlineDatabase.getCachedData('patients') as Patient[];
      return patients.find(p => p.id === patientId) || null;
    } catch (error) {
      logger.error('Failed to get patient by ID:', error);
      return null;
    }
  };

  // Search patients offline
  const searchPatientsOffline = (searchTerm: string): Patient[] => {
    const patients = query.data?.patients || [];
    if (!searchTerm.trim()) return patients;

    const term = searchTerm.toLowerCase();
    return patients.filter(patient => 
      patient.firstName?.toLowerCase().includes(term) ||
      patient.lastName?.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.phone?.includes(term) ||
      patient.mrn?.toLowerCase().includes(term)
    );
  };

  // Sync pending changes to server
  const syncPendingChanges = useMutation({
    mutationFn: async () => {
      const unsynced = await offlineDatabase.getUnsynced();
      const patientChanges = unsynced.filter(item => 
        item.collection === 'patients' || item.id?.startsWith('patient_')
      );

      if (patientChanges.length === 0) {
        return { synced: 0 };
      }

      let syncedCount = 0;
      for (const change of patientChanges) {
        try {
          // Sync to server based on operation type
          if (change.operation === 'create' || change.operation === 'update') {
            await patientService.updatePatient(tenant!.id, currentUser!.id, change.id, change.data);
          } else if (change.operation === 'delete') {
            await patientService.deletePatient(tenant!.id, change.id);
          }
          
          // Mark as synced
          await offlineDatabase.markSynced(change.id);
          syncedCount++;
        } catch (error) {
          logger.error(`Failed to sync patient change ${change.id}:`, error);
          await offlineDatabase.markSyncError(change.id, error);
        }
      }

      return { synced: syncedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.offlinePatients });
      if (result.synced > 0) {
        toast.success(`${result.synced} changes synced successfully`);
      }
    },
    onError: (error: any) => {
      toast.error('Failed to sync pending changes');
      logger.error('Sync error:', error);
    }
  });

  return {
    // Data
    patients: query.data?.patients || [],
    lastSyncTime: query.data?.lastSyncTime,
    pendingChanges: query.data?.pendingChanges || 0,
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    syncPatients: syncPatients.mutateAsync,
    updatePatientOffline: updatePatientOffline.mutateAsync,
    syncPendingChanges: syncPendingChanges.mutateAsync,
    getPatientById,
    searchPatientsOffline,
    
    // Status
    isSyncing: syncPatients.isPending || syncPendingChanges.isPending,
    isOffline
  };
}

// Hook for patient results (offline-first)
export function useOfflinePatientResults(patientId: string) {
  const { isOffline } = useOffline();
  const { currentUser } = useAuthStore();
  const { tenant } = useTenant();

  return useQuery({
    queryKey: QUERY_KEYS.patientResults(patientId),
    queryFn: async () => {
      try {
        // Try offline first
        const results = await offlineDatabase.getCachedData('results');
        const patientResults = results.filter((r: any) => r.patientId === patientId);
        
        if (patientResults.length > 0 || isOffline) {
          return patientResults;
        }
        
        // Fallback to server if online and no offline data
        if (currentUser && tenant) {
          // This would fetch from results service in real implementation
          return [];
        }
        
        return [];
      } catch (error) {
        logger.error('Failed to load patient results:', error);
        return [];
      }
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}