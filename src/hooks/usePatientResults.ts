import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useTenantStore } from '@/stores/tenant.store';

interface PatientResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  resultDate: Date;
  isCritical: boolean;
}

export function usePatientResults(patientId: string) {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['patient-results', patientId],
    queryFn: async () => {
      if (!currentTenant || !patientId) return [];

      const resultsRef = collection(db, `${currentTenant.id}_results`);
      const q = query(
        resultsRef,
        where('patientId', '==', patientId),
        orderBy('resultDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        resultDate: doc.data().resultDate.toDate(),
      })) as PatientResult[];
    },
    enabled: !!currentTenant && !!patientId,
  });
}
