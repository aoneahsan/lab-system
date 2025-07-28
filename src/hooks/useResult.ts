import { useQuery } from '@tanstack/react-query';
import { resultService } from '@/services/result.service';
import { useTenantStore } from '@/stores/tenant.store';

export function useResult(resultId: string | undefined) {
  const tenantId = useTenantStore((state) => state.currentTenant?.id);

  return useQuery({
    queryKey: ['result', tenantId, resultId],
    queryFn: async () => {
      if (!tenantId || !resultId) {
        throw new Error('Tenant ID and Result ID are required');
      }
      return resultService.getResult(tenantId, resultId);
    },
    enabled: !!tenantId && !!resultId,
  });
}
