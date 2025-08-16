import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';

export function useCancelOrder() {
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!currentTenant || !currentUser) throw new Error('Not authenticated');

      const orderRef = doc(db, `${currentTenant.id}_orders`, orderId);

      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: currentUser.uid,
        timeline: [
          {
            action: 'Order cancelled',
            timestamp: new Date(),
            user: currentUser.displayName || currentUser.email || 'Unknown',
          },
        ],
      });

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}
