import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';

export function useAcknowledgeResult() {
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultId: string, note?: string) => {
      if (!currentTenant || !user) throw new Error('Not authenticated');

      const resultRef = doc(db, `${currentTenant.id}_results`, resultId);
      
      await updateDoc(resultRef, {
        acknowledged: true,
        acknowledgedBy: user.name || user.email || 'Unknown',
        acknowledgedAt: serverTimestamp(),
        acknowledgedNote: note || '',
      });

      return resultId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['critical-results'] });
      queryClient.invalidateQueries({ queryKey: ['clinician-results'] });
      queryClient.invalidateQueries({ queryKey: ['result'] });
    },
  });
}