import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useTenantStore } from '@/stores/tenant.store';

interface Order {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  patientAge: number;
  tests: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    status?: string;
  }>;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  clinicalInfo?: string;
  createdAt: Date;
  clinicianId: string;
  timeline?: Array<{
    action: string;
    timestamp: Date;
    user: string;
  }>;
}

export function useOrder(orderId: string) {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!currentTenant || !orderId) return null;

      const orderRef = doc(db, `${currentTenant.id}_orders`, orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        timeline: data.timeline?.map((event: any) => ({
          ...event,
          timestamp: event.timestamp.toDate(),
        })),
      } as Order;
    },
    enabled: !!currentTenant && !!orderId,
  });
}
