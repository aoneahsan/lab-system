import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const financialReportsService = {
  // Revenue Report
  async getRevenueReport(
    tenantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalRevenue: number;
    collectedRevenue: number;
    pendingRevenue: number;
    revenueByCategory: Record<string, number>;
    revenueByPaymentMethod: Record<string, number>;
    dailyRevenue: Array<{ date: string; amount: number }>;
  }> {
    const invoicesQuery = query(
      collection(db, COLLECTIONS.INVOICES),
      where('tenantId', '==', tenantId),
      where('invoiceDate', '>=', Timestamp.fromDate(dateRange.start)),
      where('invoiceDate', '<=', Timestamp.fromDate(dateRange.end))
    );

    const paymentsQuery = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('tenantId', '==', tenantId),
      where('paymentDate', '>=', Timestamp.fromDate(dateRange.start)),
      where('paymentDate', '<=', Timestamp.fromDate(dateRange.end))
    );

    const [invoicesSnapshot, paymentsSnapshot] = await Promise.all([
      getDocs(invoicesQuery),
      getDocs(paymentsQuery),
    ]);

    let totalRevenue = 0;
    let pendingRevenue = 0;
    const revenueByCategory: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    invoicesSnapshot.docs.forEach((doc) => {
      const invoice = doc.data();
      totalRevenue += invoice.totalAmount;
      pendingRevenue += invoice.balanceDue;

      const dateStr = format(invoice.invoiceDate.toDate(), 'yyyy-MM-dd');
      dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + invoice.totalAmount;

      invoice.items.forEach((item: any) => {
        const category = item.testCategory || 'Uncategorized';
        revenueByCategory[category] = (revenueByCategory[category] || 0) + item.total;
      });
    });

    let collectedRevenue = 0;
    const revenueByPaymentMethod: Record<string, number> = {};

    paymentsSnapshot.docs.forEach((doc) => {
      const payment = doc.data();
      collectedRevenue += payment.amount;
      revenueByPaymentMethod[payment.method] =
        (revenueByPaymentMethod[payment.method] || 0) + payment.amount;
    });

    return {
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      revenueByCategory,
      revenueByPaymentMethod,
      dailyRevenue: Object.entries(dailyRevenue)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },

  // Aging Report
  async getAgingReport(tenantId: string): Promise<{
    current: { count: number; amount: number };
    thirtyDays: { count: number; amount: number };
    sixtyDays: { count: number; amount: number };
    ninetyDays: { count: number; amount: number };
    overNinetyDays: { count: number; amount: number };
    totalOutstanding: number;
  }> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const invoicesQuery = query(
      collection(db, COLLECTIONS.INVOICES),
      where('tenantId', '==', tenantId),
      where('balanceDue', '>', 0)
    );

    const snapshot = await getDocs(invoicesQuery);

    const aging = {
      current: { count: 0, amount: 0 },
      thirtyDays: { count: 0, amount: 0 },
      sixtyDays: { count: 0, amount: 0 },
      ninetyDays: { count: 0, amount: 0 },
      overNinetyDays: { count: 0, amount: 0 },
      totalOutstanding: 0,
    };

    snapshot.docs.forEach((doc) => {
      const invoice = doc.data();
      const invoiceDate = invoice.invoiceDate.toDate();
      const balanceDue = invoice.balanceDue;

      aging.totalOutstanding += balanceDue;

      if (invoiceDate >= thirtyDaysAgo) {
        aging.current.count++;
        aging.current.amount += balanceDue;
      } else if (invoiceDate >= sixtyDaysAgo) {
        aging.thirtyDays.count++;
        aging.thirtyDays.amount += balanceDue;
      } else if (invoiceDate >= ninetyDaysAgo) {
        aging.sixtyDays.count++;
        aging.sixtyDays.amount += balanceDue;
      } else {
        aging.overNinetyDays.count++;
        aging.overNinetyDays.amount += balanceDue;
      }
    });

    return aging;
  },

  // Insurance Analysis Report
  async getInsuranceAnalysisReport(
    tenantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalClaims: number;
    totalClaimAmount: number;
    approvedAmount: number;
    deniedAmount: number;
    pendingAmount: number;
    approvalRate: number;
    averageProcessingDays: number;
    claimsByProvider: Record<
      string,
      {
        count: number;
        totalAmount: number;
        approvedAmount: number;
        approvalRate: number;
      }
    >;
  }> {
    const claimsQuery = query(
      collection(db, COLLECTIONS.INSURANCE_CLAIMS),
      where('tenantId', '==', tenantId),
      where('claimDate', '>=', Timestamp.fromDate(dateRange.start)),
      where('claimDate', '<=', Timestamp.fromDate(dateRange.end))
    );

    const snapshot = await getDocs(claimsQuery);

    let totalClaims = 0;
    let totalClaimAmount = 0;
    let approvedAmount = 0;
    let deniedAmount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let totalProcessingDays = 0;
    let processedCount = 0;

    const claimsByProvider: Record<string, any> = {};

    snapshot.docs.forEach((doc) => {
      const claim = doc.data();
      totalClaims++;
      totalClaimAmount += claim.totalCharges;

      const providerId = claim.insuranceId;
      if (!claimsByProvider[providerId]) {
        claimsByProvider[providerId] = {
          count: 0,
          totalAmount: 0,
          approvedAmount: 0,
          approvedCount: 0,
        };
      }

      claimsByProvider[providerId].count++;
      claimsByProvider[providerId].totalAmount += claim.totalCharges;

      if (claim.status === 'approved' || claim.status === 'paid') {
        approvedAmount += claim.approvedAmount || claim.totalCharges;
        approvedCount++;
        claimsByProvider[providerId].approvedAmount += claim.approvedAmount || claim.totalCharges;
        claimsByProvider[providerId].approvedCount++;
      } else if (claim.status === 'denied') {
        deniedAmount += claim.totalCharges;
      } else if (claim.status === 'pending' || claim.status === 'submitted') {
        pendingAmount += claim.totalCharges;
      }

      if (claim.processedDate && claim.claimDate) {
        const processingTime =
          claim.processedDate.toDate().getTime() - claim.claimDate.toDate().getTime();
        totalProcessingDays += processingTime / (1000 * 60 * 60 * 24);
        processedCount++;
      }
    });

    // Calculate approval rates
    Object.keys(claimsByProvider).forEach((providerId) => {
      const provider = claimsByProvider[providerId];
      provider.approvalRate =
        provider.count > 0 ? (provider.approvedCount / provider.count) * 100 : 0;
    });

    return {
      totalClaims,
      totalClaimAmount,
      approvedAmount,
      deniedAmount,
      pendingAmount,
      approvalRate: totalClaims > 0 ? (approvedCount / totalClaims) * 100 : 0,
      averageProcessingDays: processedCount > 0 ? totalProcessingDays / processedCount : 0,
      claimsByProvider,
    };
  },

  // Monthly Summary Report
  async getMonthlySummaryReport(
    tenantId: string,
    month: Date
  ): Promise<{
    revenue: {
      invoiced: number;
      collected: number;
      outstanding: number;
    };
    tests: {
      totalPerformed: number;
      byCategory: Record<string, number>;
    };
    insurance: {
      claimsSubmitted: number;
      claimsApproved: number;
      totalClaimAmount: number;
      totalApprovedAmount: number;
    };
    topTests: Array<{ testName: string; count: number; revenue: number }>;
    topPatients: Array<{ patientName: string; totalSpent: number }>;
  }> {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // Get revenue data
    const revenueData = await this.getRevenueReport(tenantId, {
      start: monthStart,
      end: monthEnd,
    });

    // Get insurance data
    const insuranceData = await this.getInsuranceAnalysisReport(tenantId, {
      start: monthStart,
      end: monthEnd,
    });

    // Get test data from invoices
    const invoicesQuery = query(
      collection(db, COLLECTIONS.INVOICES),
      where('tenantId', '==', tenantId),
      where('invoiceDate', '>=', Timestamp.fromDate(monthStart)),
      where('invoiceDate', '<=', Timestamp.fromDate(monthEnd))
    );

    const invoicesSnapshot = await getDocs(invoicesQuery);

    const testCounts: Record<string, { count: number; revenue: number }> = {};
    const testsByCategory: Record<string, number> = {};
    const patientSpending: Record<string, { name: string; amount: number }> = {};
    let totalTests = 0;

    invoicesSnapshot.docs.forEach((doc) => {
      const invoice = doc.data();

      invoice.items.forEach((item: any) => {
        totalTests++;

        // Track test counts and revenue
        if (!testCounts[item.testName]) {
          testCounts[item.testName] = { count: 0, revenue: 0 };
        }
        testCounts[item.testName].count++;
        testCounts[item.testName].revenue += item.total;

        // Track by category
        const category = item.testCategory || 'Uncategorized';
        testsByCategory[category] = (testsByCategory[category] || 0) + 1;
      });

      // Track patient spending
      if (!patientSpending[invoice.patientId]) {
        patientSpending[invoice.patientId] = {
          name: invoice.patientName || 'Unknown',
          amount: 0,
        };
      }
      patientSpending[invoice.patientId].amount += invoice.totalAmount;
    });

    // Get top tests
    const topTests = Object.entries(testCounts)
      .map(([testName, data]) => ({
        testName,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get top patients
    const topPatients = Object.values(patientSpending)
      .map((patient) => ({
        patientName: patient.name,
        totalSpent: patient.amount,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      revenue: {
        invoiced: revenueData.totalRevenue,
        collected: revenueData.collectedRevenue,
        outstanding: revenueData.pendingRevenue,
      },
      tests: {
        totalPerformed: totalTests,
        byCategory: testsByCategory,
      },
      insurance: {
        claimsSubmitted: insuranceData.totalClaims,
        claimsApproved: Math.round((insuranceData.totalClaims * insuranceData.approvalRate) / 100),
        totalClaimAmount: insuranceData.totalClaimAmount,
        totalApprovedAmount: insuranceData.approvedAmount,
      },
      topTests,
      topPatients,
    };
  },
};
