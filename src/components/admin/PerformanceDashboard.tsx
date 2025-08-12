import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon, ClockIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTracking } from '@/providers/TrackingProvider';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  timestamp: Date;
}

interface ApiMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  endpointMetrics: Record<string, {
    count: number;
    avgTime: number;
    errors: number;
  }>;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState({
    activeUsers: 0,
    totalSessions: 0,
    avgSessionDuration: 0,
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { trackEvent } = useTracking();

  useEffect(() => {
    // Track dashboard view
    trackEvent('admin_performance_dashboard_viewed', { timeRange });

    // Fetch metrics based on time range
    fetchMetrics();
  }, [timeRange, trackEvent]);

  const fetchMetrics = async () => {
    // TODO: Implement actual API calls to fetch metrics
    // For now, using mock data
    setMetrics([
      {
        name: 'Page Load Time',
        value: 1.2,
        unit: 's',
        change: -15,
        timestamp: new Date(),
      },
      {
        name: 'API Response Time',
        value: 245,
        unit: 'ms',
        change: 5,
        timestamp: new Date(),
      },
      {
        name: 'Error Rate',
        value: 0.8,
        unit: '%',
        change: -20,
        timestamp: new Date(),
      },
      {
        name: 'Uptime',
        value: 99.9,
        unit: '%',
        change: 0,
        timestamp: new Date(),
      },
    ]);

    setApiMetrics({
      totalRequests: 15420,
      averageResponseTime: 245,
      errorRate: 0.8,
      endpointMetrics: {
        '/api/patients': { count: 4200, avgTime: 180, errors: 12 },
        '/api/tests': { count: 3800, avgTime: 220, errors: 8 },
        '/api/results': { count: 2900, avgTime: 310, errors: 15 },
        '/api/billing': { count: 1500, avgTime: 450, errors: 5 },
      },
    });

    setUserMetrics({
      activeUsers: 142,
      totalSessions: 892,
      avgSessionDuration: 1823, // seconds
    });
  };

  const responseTimeData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Response Time (ms)',
        data: [180, 195, 210, 245, 280, 220],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const errorRateData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Error Rate (%)',
        data: [1.2, 0.9, 1.1, 0.8, 0.7, 0.6, 0.8],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const endpointUsageData = {
    labels: Object.keys(apiMetrics?.endpointMetrics || {}),
    datasets: [
      {
        data: Object.values(apiMetrics?.endpointMetrics || {}).map(m => m.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="flex gap-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold">
                    {metric.value}
                    <span className="text-sm font-normal ml-1">{metric.unit}</span>
                  </p>
                  <p className={`text-sm ${metric.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </p>
                </div>
                <div className="text-gray-400">
                  {metric.name === 'Page Load Time' && <ClockIcon className="h-8 w-8" />}
                  {metric.name === 'API Response Time' && <ChartBarIcon className="h-8 w-8" />}
                  {metric.name === 'Error Rate' && <ExclamationTriangleIcon className="h-8 w-8" />}
                  {metric.name === 'Uptime' && <ChartBarIcon className="h-8 w-8" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{userMetrics.activeUsers}</p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{userMetrics.totalSessions}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {Math.floor(userMetrics.avgSessionDuration / 60)}m
              </p>
              <p className="text-sm text-gray-600">Avg Session Duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Line
              data={responseTimeData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}ms`,
                    },
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rate by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={errorRateData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}%`,
                    },
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* API Endpoint Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut
              data={endpointUsageData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(apiMetrics?.endpointMetrics || {}).map(([endpoint, metrics]) => (
                <div key={endpoint} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{endpoint}</p>
                      <p className="text-sm text-gray-600">
                        {metrics.count.toLocaleString()} requests
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="font-medium">{metrics.avgTime}ms</span> avg
                      </p>
                      <p className="text-sm text-red-600">
                        {metrics.errors} errors ({((metrics.errors / metrics.count) * 100).toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">API Status</p>
              <p className="text-2xl font-bold text-green-600">Operational</p>
              <p className="text-sm text-green-700">All systems running normally</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">Database Status</p>
              <p className="text-2xl font-bold text-blue-600">Healthy</p>
              <p className="text-sm text-blue-700">Response time: 12ms</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="font-medium text-yellow-800">Background Jobs</p>
              <p className="text-2xl font-bold text-yellow-600">42 Active</p>
              <p className="text-sm text-yellow-700">8 pending, 0 failed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};