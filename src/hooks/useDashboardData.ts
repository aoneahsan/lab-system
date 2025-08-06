import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { usePatientStats } from '@/hooks/usePatients';
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
  const { data: patientStats } = usePatientStats();

  return useQuery({
    queryKey: ['dashboardSummary', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      // Get test statistics
      const testStats = await testService.getTestStatistics(tenant.id);
      
      // Get result statistics
      const resultStats = await resultService.getResultStatistics(tenant.id);
      
      // Get billing statistics
      const billingStats = await billingService.getBillingStatistics(tenant.id);

      const summary: DashboardSummary = {
        totalPatients: patientStats?.totalPatients || 0,
        testsToday: testStats?.todayCount || 0,
        pendingResults: resultStats?.pendingCount || 0,
        revenueToday: billingStats?.todaysPayments || 0,
      };

      return summary;
    },
    enabled: !!tenant?.id && !!patientStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useRecentTests = (limit: number = 5) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['recentTests', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const orders = await testService.getTestOrders(tenant.id);
      
      // Sort and limit manually
      const sortedOrders = orders
        .sort((a, b) => {
          const dateA = a.orderDate instanceof Date ? a.orderDate : a.orderDate.toDate();
          const dateB = b.orderDate instanceof Date ? b.orderDate : b.orderDate.toDate();
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      return sortedOrders.map(order => ({
        id: order.id,
        patientName: 'Unknown Patient', // Patient info would need to be fetched separately
        testNames: order.tests?.map(test => test.testName) || [],
        status: order.status,
        orderedAt: order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate(),
      }));
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCriticalResults = (limit: number = 3) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['criticalResults', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const response = await resultService.getResults(tenant.id, {
        flagType: 'critical'
      });
      
      // Sort and limit manually
      const sortedResults = response.items
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      return sortedResults.map(result => ({
        id: result.id,
        patientName: 'Test Patient',
        testName: result.testName || 'Unknown Test',
        value: `${result.value} ${result.unit || ''}`.trim(),
        severity: (result.flag === 'critical_high' || result.flag === 'critical_low') ? 'critical' as const : 'high' as const,
        reportedAt: result.createdAt instanceof Date ? result.createdAt : result.createdAt.toDate(),
      }));
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};