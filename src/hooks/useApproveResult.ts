import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';

export function useApproveResult() {
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultId: string, comments?: string) => {
      if (!currentTenant || !user) throw new Error('Not authenticated');

      const resultRef = doc(db, `${currentTenant.id}_results`, resultId);
      
      await updateDoc(resultRef, {
        status: 'final',
        approvedBy: user.name || user.email || 'Unknown',
        approvedAt: serverTimestamp(),
        approvalComments: comments || '',
      });

      return resultId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinician-results'] });
      queryClient.invalidateQueries({ queryKey: ['result'] });
    },
  });
}