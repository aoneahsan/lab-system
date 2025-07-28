import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenant.store';

interface PatientOrder {
  id: string;
  orderNumber: string;
  tests: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
  }>;
  status: string;
  createdAt: Date;
}

export function usePatientOrders(patientId: string) {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['patient-orders', patientId],
    queryFn: async () => {
      if (!currentTenant || !patientId) return [];

      const ordersRef = collection(db, `${currentTenant.id}_orders`);
      const q = query(ordersRef, where('patientId', '==', patientId), orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as PatientOrder[];
    },
    enabled: !!currentTenant && !!patientId,
  });
}
