import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  BarChart3,
  Receipt,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useBillingStatistics } from '@/hooks/useBilling';
import { uiLogger } from '@/services/logger.service';

const FinancialReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date(),
  });
  const [reportType, setReportType] = useState<string>('revenue');

  const { data: statistics, isLoading } = useBillingStatistics(
    dateRange.startDate,
    dateRange.endDate
  );

  const reportTypes = [
    { id: 'revenue', name: 'Revenue Report', icon: DollarSign },
    { id: 'collections', name: 'Collections Report', icon: CreditCard },
    { id: 'aging', name: 'Aging Report', icon: Calendar },
    { id: 'insurance', name: 'Insurance Analysis', icon: Receipt },
    { id: 'patient', name: 'Patient Statements', icon: Users },
    { id: 'tax', name: 'Tax Report', icon: FileText },
  ];

  const generateReport = () => {
    // In a real implementation, this would generate and download the report
    uiLogger.log('Generating report:', reportType, dateRange);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-2">Generate comprehensive financial reports and analytics</p>
      </div>

      {/* Report Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`h-6 w-6 mb-2 mx-auto ${
                    reportType === type.id ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    reportType === type.id ? 'text-blue-900' : 'text-gray-700'
                  }`}
                >
                  {type.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={format(dateRange.startDate, 'yyyy-MM-dd')}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  startDate: new Date(e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={format(dateRange.endDate, 'yyyy-MM-dd')}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  endDate: new Date(e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Quick Date Range Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => {
              const today = new Date();
              setDateRange({ startDate: today, endDate: today });
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              setDateRange({ startDate: yesterday, endDate: yesterday });
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              setDateRange({ startDate: weekStart, endDate: today });
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            This Week
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
              setDateRange({ startDate: monthStart, endDate: today });
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
              const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              setDateRange({ startDate: lastMonthStart, endDate: lastMonthEnd });
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Last Month
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const yearStart = new Date(today.getFullYear(), 0, 1);
              setDateRange({ startDate: yearStart, endDate: today });
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Year to Date
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Preview</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600">Total Revenue</span>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ${statistics?.totalRevenue.toLocaleString() || '0'}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-600">Collected</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ${((statistics?.totalRevenue || 0) * 0.85).toLocaleString()}
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-yellow-600">Pending</span>
                  <Receipt className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  ${statistics?.pendingPayments.toLocaleString() || '0'}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-red-600">Overdue</span>
                  <Calendar className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-900">
                  ${statistics?.overdueAmount.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Revenue Trend</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                <p className="text-gray-500">Chart visualization will be displayed here</p>
              </div>
            </div>

            {/* Additional Metrics */}
            {reportType === 'revenue' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Average Invoice</p>
                  <p className="text-xl font-semibold">
                    $
                    {Math.round((statistics?.totalRevenue || 0) / (statistics?.totalInvoices || 1))}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
                  <p className="text-xl font-semibold">{statistics?.collectionRate || 0}%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Avg Payment Time</p>
                  <p className="text-xl font-semibold">
                    {statistics?.averagePaymentTime || 0} days
                  </p>
                </div>
              </div>
            )}

            {reportType === 'insurance' && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Top Insurance Providers</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medicare</span>
                    <span className="text-sm font-medium">$45,230</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Blue Cross Blue Shield</span>
                    <span className="text-sm font-medium">$38,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aetna</span>
                    <span className="text-sm font-medium">$28,120</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">United Healthcare</span>
                    <span className="text-sm font-medium">$22,890</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={generateReport}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Generate Report
        </button>
        <button
          onClick={() => navigate('/billing')}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Billing
        </button>
      </div>
    </div>
  );
};

export default FinancialReportsPage;
