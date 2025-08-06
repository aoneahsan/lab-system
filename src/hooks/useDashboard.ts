import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { usePatientStats } from '@/hooks/usePatients';
import { testService } from '@/services/test.service';
import { resultService } from '@/services/result.service';
import { billingService } from '@/services/billing.service';
import { inventoryService } from '@/services/inventory.service';
import { startOfDay, endOfDay } from 'date-fns';
import { useTenantStore } from '@/stores/tenant.store';

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
  const { currentTenant } = useTenantStore();
  const { data: patientStats } = usePatientStats();

  return useQuery({
    queryKey: ['dashboardStats', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');

      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get today's tests count
      // Get tests created today
      const testsToday = await testService.getTests(currentTenant.id).then(tests => 
        tests.filter(test => {
          const testDate = test.createdAt instanceof Date ? test.createdAt : test.createdAt.toDate();
          return testDate >= startOfToday && testDate <= endOfToday;
        }).length
      );

      // Get pending results count
      // Get pending results count
      const pendingResults = await resultService.getResults(currentTenant.id, {
        status: 'pending'
      }).then(results => results.total);

      // Get today's revenue
      // Get today's revenue
      const billingStats = await billingService.getBillingStatistics(currentTenant.id);
      const revenueToday = billingStats.todaysPayments || 0;

      // Get critical results count
      // Get critical results count
      const criticalResults = await resultService.getResults(currentTenant.id, {
        flagType: 'critical'
      }).then(results => results.total);

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
    enabled: !!currentTenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useDashboardRecentTests = (limit: number = 5) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['dashboardRecentTests', currentTenant?.id, limit],
    queryFn: async () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');

      // Get recent test orders
      const allTests = await testService.getTests(currentTenant.id);
      const recentOrders = allTests
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      const recentTests: DashboardRecentTest[] = recentOrders.map(order => ({
        id: order.id,
        patientName: 'Test Patient',
        testNames: [order.name],
        status: 'pending' as const,
        orderedAt: order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate(),
      }));

      return recentTests;
    },
    enabled: !!currentTenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDashboardCriticalResults = (limit: number = 5) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['dashboardCriticalResults', currentTenant?.id, limit],
    queryFn: async () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');

      // Get recent critical results
      const criticalResults = await resultService.getResults(currentTenant.id, {
        flagType: 'critical',
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }).then(res => res.items);

      const results: DashboardCriticalResult[] = criticalResults.map(result => ({
        id: result.id,
        patientName: 'Test Patient',
        testName: result.testName || 'Unknown Test',
        value: String(result.value || ''),
        referenceRange: result.referenceRange?.normal || '',
        severity: (result.flag === 'critical_high' || result.flag === 'critical_low') ? 'critical' : 'high' as const,
        reportedAt: result.createdAt instanceof Date ? result.createdAt : result.createdAt.toDate(),
      }));

      return results;
    },
    enabled: !!currentTenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDashboardQuickActions = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['dashboardQuickActions', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) throw new Error('No tenant selected');

      // Get counts for quick actions
      const pendingOrders = await testService.getTests(currentTenant.id).then(tests => 
        tests.filter(t => t.isActive).length
      );
      const pendingPayments = await billingService.getInvoices(currentTenant.id).then(invoices =>
        invoices.filter(i => i.paymentStatus === 'pending').length
      );
      const lowInventory = await inventoryService.getInventoryItems({ stockStatus: 'low_stock' }).then(res => res.items.length);

      return {
        pendingOrders,
        pendingPayments,
        lowInventory,
      };
    },
    enabled: !!currentTenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};