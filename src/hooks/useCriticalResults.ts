import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';
import { useTenantStore } from '@/stores/tenant.store';

interface CriticalResult {
  id: string;
  testName: string;
  testCode: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientPhone: string;
  value: string;
  unit: string;
  referenceRange: string;
  criticality: 'high' | 'critical' | 'panic';
  criticalMessage: string;
  resultDate: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgedNote?: string;
  orderNumber: string;
  isCritical: boolean;
}

interface UseCriticalResultsParams {
  filter?: 'pending' | 'acknowledged' | 'all';
}

export function useCriticalResults(params?: UseCriticalResultsParams) {
  const { currentUser } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const filter = params?.filter || 'pending';

  return useQuery({
    queryKey: ['critical-results', filter, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser || !currentTenant) return [];

      const resultsRef = collection(db, `${currentTenant.id}_results`);
      let q = query(
        resultsRef,
        where('clinicianId', '==', currentUser.uid),
        where('isCritical', '==', true),
        orderBy('resultDate', 'desc')
      );

      if (filter === 'pending') {
        q = query(q, where('acknowledged', '==', false));
      } else if (filter === 'acknowledged') {
        q = query(q, where('acknowledged', '==', true));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        resultDate: doc.data().resultDate.toDate(),
        acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
      })) as CriticalResult[];
    },
    enabled: !!currentUser && !!currentTenant,
  });
}