import React, { useState } from 'react';
import { TrendingUp, Users, Activity, DollarSign, Clock, BarChart3, RefreshCw } from 'lucide-react';
import { useAnalyticsMetrics } from '@/hooks/useReports';
import type { DateRangePreset } from '@/types/report.types';

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangePreset>('last30days');
  const { data: metrics, isLoading, refetch } = useAnalyticsMetrics(dateRange);

  const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'lastQuarter', label: 'Last Quarter' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalTests.toLocaleString()}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalPatients.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Turnaround</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageTurnaroundTime.toFixed(1)}h
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Volume Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Test Volume Trend
          </h3>
          <div className="space-y-2">
            {metrics.testVolumeTrend.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-12">{item.label}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${
                        (item.value / Math.max(...metrics.testVolumeTrend.map((t) => t.value))) *
                        100
                      }%`,
                      minWidth: '3rem',
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Trend
          </h3>
          <div className="space-y-2">
            {metrics.revenueTrend.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-12">{item.label}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-green-600 h-6 rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${
                        (item.value / Math.max(...metrics.revenueTrend.map((t) => t.value))) * 100
                      }%`,
                      minWidth: '3rem',
                    }}
                  >
                    <span className="text-xs text-white font-medium">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tests and Department Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Tests
          </h3>
          <div className="space-y-2">
            {metrics.topTests.slice(0, 5).map((test, index) => (
              <div key={test.testCode} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm text-gray-900">{test.testName}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{test.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
          <div className="space-y-3">
            {metrics.departmentStats.map((dept) => (
              <div key={dept.department} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{dept.department}</span>
                  <span className="text-sm text-gray-600">{dept.tests} tests</span>
                </div>
                <div className="mt-1">
                  <span className="text-sm text-green-600 font-medium">
                    {formatCurrency(dept.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
