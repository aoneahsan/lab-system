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
        revenueToday: billingStats?.todayRevenue || 0,
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

      const orders = await testService.getTestOrders(tenant.id, {
        limit,
        sortBy: 'orderedAt',
        sortDirection: 'desc',
      });

      return orders.map(order => ({
        id: order.id,
        patientName: order.patientName || 'Unknown Patient',
        testNames: order.orderedTests.map(test => test.name),
        status: order.status,
        orderedAt: order.orderedAt,
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

      const results = await resultService.getResults(tenant.id, {
        flags: ['CRITICAL', 'HIGH'],
        limit,
        sortBy: 'reportedAt',
        sortDirection: 'desc',
      });

      return results.map(result => ({
        id: result.id,
        patientName: result.patientName || 'Unknown Patient',
        testName: result.testName,
        value: `${result.value} ${result.unit || ''}`.trim(),
        severity: result.flags.includes('CRITICAL') ? 'critical' : 'high',
        reportedAt: result.reportedAt,
      }));
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};