import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { usePatientStats } from '@/hooks/usePatients';
import { testService } from '@/services/test.service';
import { resultService } from '@/services/result.service';
import { billingService } from '@/services/billing.service';
import { inventoryService } from '@/services/inventory.service';
import { startOfDay, endOfDay } from 'date-fns';

export interface DashboardStats {
  totalPatients: number;
  testsToday: number;
  pendingResults: number;
  revenueToday: number;
  criticalResults: number;
  newPatientsToday: number;
}

export interface DashboardRecentTest {
  id: string;
  patientName: string;
  testNames: string[];
  status: 'pending' | 'in_progress' | 'completed';
  orderedAt: Date;
}

export interface DashboardCriticalResult {
  id: string;
  patientName: string;
  testName: string;
  value: string;
  referenceRange: string;
  severity: 'high' | 'critical';
  reportedAt: Date;
}

export const useDashboardStats = () => {
  const { tenant } = useTenant();
  const { data: patientStats } = usePatientStats();

  return useQuery({
    queryKey: ['dashboardStats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get today's tests count
      const testsToday = await testService.getTestOrderCountByDateRange(
        tenant.id,
        startOfToday,
        endOfToday
      );

      // Get pending results count
      const pendingResults = await resultService.getPendingResultsCount(tenant.id);

      // Get today's revenue
      const revenueToday = await billingService.getRevenueByDateRange(
        tenant.id,
        startOfToday,
        endOfToday
      );

      // Get critical results count
      const criticalResults = await resultService.getCriticalResultsCount(tenant.id);

      // Get new patients today
      const newPatientsToday = patientStats?.newPatientsThisMonth || 0; // This would need to be refined to get today's count

      const stats: DashboardStats = {
        totalPatients: patientStats?.totalPatients || 0,
        testsToday,
        pendingResults,
        revenueToday,
        criticalResults,
        newPatientsToday,
      };

      return stats;
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useDashboardRecentTests = (limit: number = 5) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['dashboardRecentTests', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const recentOrders = await testService.getRecentTestOrders(tenant.id, limit);

      const recentTests: DashboardRecentTest[] = recentOrders.map(order => ({
        id: order.id,
        patientName: `${order.patient.firstName} ${order.patient.lastName}`,
        testNames: order.tests.map(test => test.name),
        status: order.status,
        orderedAt: order.orderedAt,
      }));

      return recentTests;
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDashboardCriticalResults = (limit: number = 5) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['dashboardCriticalResults', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const criticalResults = await resultService.getRecentCriticalResults(tenant.id, limit);

      const results: DashboardCriticalResult[] = criticalResults.map(result => ({
        id: result.id,
        patientName: `${result.patient.firstName} ${result.patient.lastName}`,
        testName: result.test.name,
        value: `${result.value} ${result.unit}`,
        referenceRange: result.referenceRange,
        severity: result.flags.includes('CRITICAL') ? 'critical' : 'high',
        reportedAt: result.reportedAt,
      }));

      return results;
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDashboardQuickActions = () => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['dashboardQuickActions', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) throw new Error('No tenant selected');

      // Get counts for quick actions
      const pendingOrders = await testService.getPendingOrdersCount(tenant.id);
      const pendingPayments = await billingService.getPendingPaymentsCount(tenant.id);
      const lowInventory = await inventoryService.getLowStockItemsCount(tenant.id);

      return {
        pendingOrders,
        pendingPayments,
        lowInventory,
      };
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};