import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { patientService } from '@/services/patient.service';
import { testService } from '@/services/test.service';
import { resultService } from '@/services/result.service';
import { billingService } from '@/services/billing.service';

export interface DashboardSummary {
  totalPatients: number;
  testsToday: number;
  pendingResults: number;
  revenueToday: number;
}

export const useDashboardSummary = () => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['dashboardSummary', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      try {
        // Fetch all statistics in parallel
        const [patientStats, testStats, resultStats, billingStats] = await Promise.all([
          patientService.getPatientStats(tenant.id),
          testService.getTestStatistics(tenant.id),
          resultService.getResultStatistics(tenant.id),
          billingService.getBillingStatistics(tenant.id),
        ]);

        const summary: DashboardSummary = {
          totalPatients: patientStats?.totalPatients || 0,
          testsToday: testStats?.todayCount || 0,
          pendingResults: resultStats?.pendingCount || 0,
          revenueToday: billingStats?.todaysPayments || 0,
        };

        return summary;
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        // Return default values on error
        return {
          totalPatients: 0,
          testsToday: 0,
          pendingResults: 0,
          revenueToday: 0,
        };
      }
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
  });
};

export const useRecentTests = (limit: number = 5) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['recentTests', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      try {
        const orders = await testService.getTestOrders(tenant.id);

        // Sort and limit manually
        const sortedOrders = orders
          .sort((a, b) => {
            const dateA = a.orderDate instanceof Date ? a.orderDate : a.orderDate.toDate();
            const dateB = b.orderDate instanceof Date ? b.orderDate : b.orderDate.toDate();
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, limit);

        return sortedOrders.map((order) => ({
          id: order.id,
          patientName: 'Unknown Patient', // Patient info would need to be fetched separately
          testNames: order.tests?.map((test) => test.testName) || [],
          status: order.status,
          orderedAt: order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate(),
        }));
      } catch (error) {
        console.error('Error fetching recent tests:', error);
        return [];
      }
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

export const useCriticalResults = (limit: number = 3) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['criticalResults', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      try {
        const response = await resultService.getResults(tenant.id, {
          flagType: 'critical',
        });

        // Sort and limit manually
        const sortedResults = response.items
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
            const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, limit);

        return sortedResults.map((result) => ({
          id: result.id,
          patientName: 'Test Patient',
          testName: result.testName || 'Unknown Test',
          value: `${result.value} ${result.unit || ''}`.trim(),
          severity:
            result.flag === 'critical_high' || result.flag === 'critical_low'
              ? ('critical' as const)
              : ('high' as const),
          reportedAt:
            result.createdAt instanceof Date ? result.createdAt : result.createdAt.toDate(),
        }));
      } catch (error) {
        console.error('Error fetching critical results:', error);
        return [];
      }
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};
