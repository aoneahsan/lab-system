import { useQuery } from '@tanstack/react-query';
import { patientService } from '@/services/patient.service';
import { useTenantStore } from '@/stores/tenant.store';

export function usePatient(patientId: string | undefined) {
  const tenantId = useTenantStore((state) => state.currentTenant?.id);

  return useQuery({
    queryKey: ['patient', tenantId, patientId],
    queryFn: async () => {
      if (!tenantId || !patientId) {
        throw new Error('Tenant ID and Patient ID are required');
      }
      return patientService.getPatient(tenantId, patientId);
    },
    enabled: !!tenantId && !!patientId,
  });
}