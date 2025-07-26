import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';

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

interface UseOrdersParams {
  clinicianId?: string;
  status?: string;
  patientId?: string;
}

export function useOrders(params?: UseOrdersParams) {
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      if (!user || !currentTenant) return [];

      const ordersRef = collection(db, `${currentTenant.id}_orders`);
      const constraints: QueryConstraint[] = [];

      // Add clinician filter
      if (params?.clinicianId === 'current') {
        constraints.push(where('clinicianId', '==', user.uid));
      } else if (params?.clinicianId) {
        constraints.push(where('clinicianId', '==', params.clinicianId));
      }

      // Add status filter
      if (params?.status) {
        constraints.push(where('status', '==', params.status));
      }

      // Add patient filter
      if (params?.patientId) {
        constraints.push(where('patientId', '==', params.patientId));
      }

      // Add ordering
      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(ordersRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        timeline: doc.data().timeline?.map((event: any) => ({
          ...event,
          timestamp: event.timestamp.toDate(),
        })),
      })) as Order[];
    },
    enabled: !!user && !!currentTenant,
  });
}