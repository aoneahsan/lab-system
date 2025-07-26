import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';

interface PendingOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  tests: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
  }>;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'routine' | 'urgent' | 'stat';
  createdAt: Date;
  clinicianId: string;
}

export function usePendingOrders() {
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['pending-orders', user?.uid],
    queryFn: async () => {
      if (!user || !currentTenant) return [];

      const ordersRef = collection(db, `${currentTenant.id}_orders`);
      const q = query(
        ordersRef,
        where('clinicianId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as PendingOrder[];
    },
    enabled: !!user && !!currentTenant,
  });
}