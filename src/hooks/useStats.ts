import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import { startOfDay, endOfDay } from 'date-fns';

interface Stats {
  resultsReady: number;
  activePatients: number;
  testsToday: number;
  recentActivity: Array<{
    description: string;
    timestamp: Date;
  }>;
}

export function useStats() {
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['clinician-stats', user?.uid],
    queryFn: async () => {
      if (!user || !currentTenant) return null;

      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get results ready for review
      const resultsRef = collection(db, `${currentTenant.id}_results`);
      const resultsQuery = query(
        resultsRef,
        where('clinicianId', '==', user.uid),
        where('status', '==', 'preliminary')
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsReady = resultsSnapshot.size;

      // Get active patients (patients with recent orders)
      const ordersRef = collection(db, `${currentTenant.id}_orders`);
      const patientsQuery = query(
        ordersRef,
        where('clinicianId', '==', user.uid),
        where('createdAt', '>=', startOfToday)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const uniquePatients = new Set(patientsSnapshot.docs.map(doc => doc.data().patientId));
      const activePatients = uniquePatients.size;

      // Get tests ordered today
      const testsToday = patientsSnapshot.docs.reduce((total, doc) => {
        return total + (doc.data().tests?.length || 0);
      }, 0);

      // Get recent activity
      const activityQuery = query(
        ordersRef,
        where('clinicianId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const recentActivity = activitySnapshot.docs.map(doc => ({
        description: `Order #${doc.data().orderNumber} created for ${doc.data().patientName}`,
        timestamp: doc.data().createdAt.toDate(),
      }));

      return {
        resultsReady,
        activePatients,
        testsToday,
        recentActivity,
      } as Stats;
    },
    enabled: !!user && !!currentTenant,
  });
}