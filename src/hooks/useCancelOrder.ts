import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';

export function useCancelOrder() {
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!currentTenant || !user) throw new Error('Not authenticated');

      const orderRef = doc(db, `${currentTenant.id}_orders`, orderId);
      
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: user.uid,
        timeline: [{
          action: 'Order cancelled',
          timestamp: new Date(),
          user: user.name || user.email || 'Unknown',
        }],
      });

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}