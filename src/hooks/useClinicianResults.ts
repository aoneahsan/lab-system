import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';

interface ClinicianResult {
  id: string;
  testName: string;
  testCode: string;
  category: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  orderNumber: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'H' | 'L' | 'C';
  status: 'pending' | 'preliminary' | 'final' | 'critical' | 'amended';
  isCritical: boolean;
  resultDate: Date;
  collectionDate: Date;
}

interface UseClinicianResultsParams {
  clinicianId?: string;
  status?: string;
  orderId?: string;
  patientId?: string;
}

export function useClinicianResults(params?: UseClinicianResultsParams) {
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['clinician-results', params],
    queryFn: async () => {
      if (!user || !currentTenant) return [];

      const resultsRef = collection(db, `${currentTenant.id}_results`);
      const constraints: QueryConstraint[] = [];

      // Add clinician filter
      if (params?.clinicianId === 'current') {
        constraints.push(where('clinicianId', '==', user.uid));
      } else if (params?.clinicianId) {
        constraints.push(where('clinicianId', '==', params.clinicianId));
      }

      // Add status filter
      if (params?.status && params.status !== 'critical') {
        constraints.push(where('status', '==', params.status));
      } else if (params?.status === 'critical') {
        constraints.push(where('isCritical', '==', true));
      }

      // Add order filter
      if (params?.orderId) {
        constraints.push(where('orderId', '==', params.orderId));
      }

      // Add patient filter
      if (params?.patientId) {
        constraints.push(where('patientId', '==', params.patientId));
      }

      // Add ordering
      constraints.push(orderBy('resultDate', 'desc'));

      const q = query(resultsRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        resultDate: doc.data().resultDate.toDate(),
        collectionDate: doc.data().collectionDate.toDate(),
      })) as ClinicianResult[];
    },
    enabled: !!user && !!currentTenant,
  });
}