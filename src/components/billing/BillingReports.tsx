import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing';
import { formatCurrency } from '@/utils/formatters';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const BillingReports: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date(),
  });
  const [reportType, setReportType] = useState<'revenue' | 'outstanding' | 'payments'>('revenue');

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-report', dateRange],
    queryFn: () =>
      billingService.getRevenueSummary({
        ...dateRange,
        groupBy: 'month',
      }),
    enabled: reportType === 'revenue',
  });

  const { data: outstandingData } = useQuery({
    queryKey: ['outstanding-report'],
    queryFn: () => billingService.getOutstandingBalances({}),
    enabled: reportType === 'outstanding',
  });

  const { data: paymentData } = useQuery({
    queryKey: ['payment-report', dateRange],
    queryFn: () => billingService.getPaymentSummary(dateRange),
    enabled: reportType === 'payments',
  });

  const exportReport = async () => {
    const blob = await billingService.exportBillingData({
      ...dateRange,
      format: 'excel',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const revenueChartData = {
    labels:
      revenueData?.data.map((d) =>
        new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      ) || [],
    datasets: [
      {
        label: 'Revenue',
        data: revenueData?.data.map((d) => d.revenue) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const paymentMethodChartData = {
    labels: Object.keys(paymentData?.byMethod || {}),
    datasets: [
      {
        data: Object.values(paymentData?.byMethod || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Billing Reports</h1>
        <button
          onClick={exportReport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="revenue">Revenue Summary</option>
              <option value="outstanding">Outstanding Balances</option>
              <option value="payments">Payment Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({ ...dateRange, startDate: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({ ...dateRange, endDate: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'revenue' && revenueData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h2>
            <div className="h-64">
              <Bar
                data={revenueChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Revenue</span>
                <span className="font-semibold">{formatCurrency(revenueData.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid Amount</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(revenueData.paid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pending Amount</span>
                <span className="font-semibold text-yellow-600">
                  {formatCurrency(revenueData.pending)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Overdue Amount</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(revenueData.overdue)}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-500">Collection Rate</span>
                  <span className="font-semibold">
                    {((revenueData.paid / revenueData.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'payments' && paymentData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
            <div className="h-64">
              <Doughnut
                data={paymentMethodChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Payments</span>
                <span className="font-semibold">{formatCurrency(paymentData.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Refunds</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(paymentData.refunds)}
                </span>
              </div>
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">By Status</h3>
                {Object.entries(paymentData.byStatus).map(([status, amount]) => (
                  <div key={status} className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500 capitalize">{status}</span>
                    <span className="text-sm">{formatCurrency(amount as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'outstanding' && outstandingData && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Outstanding Balances - Total: {formatCurrency(outstandingData.totalAmount)}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outstandingData.bills.map((bill) => {
                  const daysOverdue = Math.max(
                    0,
                    Math.floor(
                      (new Date().getTime() - new Date(bill.dueDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                  return (
                    <tr key={bill.billId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Patient #{bill.patientId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {formatCurrency(bill.totals.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {daysOverdue > 0 ? `${daysOverdue} days` : 'Not overdue'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingReports;
