import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing';
import { formatCurrency } from '@/utils/formatters';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BillingDashboard: React.FC = () => {
  const [dateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });

  const { data: revenueSummary } = useQuery({
    queryKey: ['revenue-summary', dateRange],
    queryFn: () => billingService.getRevenueSummary({
      ...dateRange,
      groupBy: 'day'
    })
  });

  const { data: outstandingData } = useQuery({
    queryKey: ['outstanding-balances'],
    queryFn: () => billingService.getOutstandingBalances({ limit: 5 })
  });

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary', dateRange],
    queryFn: () => billingService.getPaymentSummary(dateRange)
  });

  const { data: recentBills } = useQuery({
    queryKey: ['recent-bills'],
    queryFn: () => billingService.getBills({ limit: 10 })
  });

  const chartData = {
    labels: revenueSummary?.data.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Revenue',
        data: revenueSummary?.data.map(d => d.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Payments',
        data: revenueSummary?.data.map(d => d.payments) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Billing Dashboard</h1>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Generate Report
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <CreditCardIcon className="h-4 w-4 mr-2" />
            New Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(revenueSummary?.total || 0)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-blue-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Last 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(revenueSummary?.paid || 0)}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {((revenueSummary?.paid || 0) / (revenueSummary?.total || 1) * 100).toFixed(1)}% collected
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {formatCurrency(revenueSummary?.pending || 0)}
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Awaiting payment</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(revenueSummary?.overdue || 0)}
              </p>
            </div>
            <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {outstandingData?.bills.length || 0} bills
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Revenue Trend</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              7 Days
            </button>
            <button className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded-md bg-blue-50">
              30 Days
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              90 Days
            </button>
          </div>
        </div>
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {paymentSummary?.byMethod && Object.entries(paymentSummary.byMethod).map(([method, amount]) => {
              const percentage = (amount / paymentSummary.total) * 100;
              return (
                <div key={method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Outstanding Balances</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {outstandingData?.bills.slice(0, 5).map((bill) => (
              <div key={bill.billId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{bill.billNumber}</p>
                  <p className="text-xs text-gray-500">
                    Due {new Date(bill.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(bill.totals.balance)}
                  </p>
                  <p className="text-xs text-gray-500">{bill.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Bills</h2>
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBills?.bills.map((bill) => (
                <tr key={bill.billId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bill.billNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Patient #{bill.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="capitalize">{bill.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.totals.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                      bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;