import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';

interface CreateOrderData {
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  tests: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
  }>;
  priority: 'routine' | 'urgent' | 'stat';
  clinicalInfo?: string;
  clinicianId: string;
}

export function useCreateOrder() {
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      if (!currentTenant || !currentUser) throw new Error('Not authenticated');

      const ordersRef = collection(db, `${currentTenant.id}_orders`);

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Calculate patient age
      const patientAge = new Date().getFullYear() - new Date(data.patientDOB).getFullYear();

      const orderData = {
        ...data,
        orderNumber,
        patientAge,
        clinicianId: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        timeline: [
          {
            action: 'Order created',
            timestamp: new Date(),
            user: currentUser.displayName || currentUser.email || 'Unknown',
          },
        ],
      };

      const docRef = await addDoc(ordersRef, orderData);

      return { id: docRef.id, ...orderData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
      queryClient.invalidateQueries({ queryKey: ['clinician-stats'] });
    },
  });
}
