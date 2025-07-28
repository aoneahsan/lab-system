import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';

export function useAcknowledgeResult() {
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resultId, note }: { resultId: string; note?: string }) => {
      if (!currentTenant || !currentUser) throw new Error('Not authenticated');

      const resultRef = doc(db, `${currentTenant.id}_results`, resultId);
      
      await updateDoc(resultRef, {
        acknowledged: true,
        acknowledgedBy: currentUser.displayName || currentUser.email || 'Unknown',
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