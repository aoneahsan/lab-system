import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, Eye, Clock, TrendingUp, Users } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportAnalytics() {
  const [timeRange, setTimeRange] = useState('week');

  // Generate mock analytics data
  const generateAnalyticsData = () => {
    const endDate = new Date();
    const startDate = timeRange === 'week' ? subDays(endDate, 7) : subDays(endDate, 30);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Report generation trend
    const generationTrend = days.map(date => ({
      date: format(date, 'MMM dd'),
      generated: Math.floor(Math.random() * 50) + 20,
      downloaded: Math.floor(Math.random() * 40) + 15,
      viewed: Math.floor(Math.random() * 60) + 25
    }));

    // Report types distribution
    const reportTypes = [
      { name: 'Test Results', value: 342, percentage: 35 },
      { name: 'Patient Summary', value: 234, percentage: 24 },
      { name: 'QC Reports', value: 156, percentage: 16 },
      { name: 'Financial Reports', value: 117, percentage: 12 },
      { name: 'Inventory Reports', value: 78, percentage: 8 },
      { name: 'Other', value: 49, percentage: 5 }
    ];

    // User activity
    const userActivity = [
      { user: 'Dr. Sarah Johnson', reports: 156, lastActive: '2 hours ago' },
      { user: 'Lab Tech Mike Chen', reports: 134, lastActive: '1 hour ago' },
      { user: 'Admin Lisa Wong', reports: 98, lastActive: '30 minutes ago' },
      { user: 'Dr. James Smith', reports: 87, lastActive: '3 hours ago' },
      { user: 'Quality Manager', reports: 72, lastActive: '45 minutes ago' }
    ];

    // Generation time distribution
    const generationTime = [
      { time: '0-5s', count: 234 },
      { time: '5-10s', count: 156 },
      { time: '10-20s', count: 89 },
      { time: '20-30s', count: 45 },
      { time: '30s+', count: 23 }
    ];

    // Popular templates
    const popularTemplates = [
      { template: 'Standard Test Result', usage: 456, trend: 'up' },
      { template: 'Comprehensive Patient Report', usage: 234, trend: 'up' },
      { template: 'Monthly QC Summary', usage: 187, trend: 'stable' },
      { template: 'Billing Statement', usage: 156, trend: 'down' },
      { template: 'Inventory Status', usage: 98, trend: 'up' }
    ];

    return {
      generationTrend,
      reportTypes,
      userActivity,
      generationTime,
      popularTemplates
    };
  };

  const { generationTrend, reportTypes, userActivity, generationTime, popularTemplates } = generateAnalyticsData();

  // Calculate statistics
  const totalReports = reportTypes.reduce((sum, type) => sum + type.value, 0);
  const avgGenerationTime = 8.5; // seconds
  const downloadRate = 78; // percentage

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Report Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track report generation, usage, and performance metrics
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports.toLocaleString()}</p>
            </div>
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+12% from last period</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Generation Time</p>
              <p className="text-2xl font-bold text-gray-900">{avgGenerationTime}s</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            95% under 20 seconds
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Download Rate</p>
              <p className="text-2xl font-bold text-gray-900">{downloadRate}%</p>
            </div>
            <Download className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Of generated reports
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{userActivity.length}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            In the last 24 hours
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generation Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Report Activity Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="generated" stroke="#3b82f6" name="Generated" strokeWidth={2} />
              <Line type="monotone" dataKey="viewed" stroke="#10b981" name="Viewed" strokeWidth={2} />
              <Line type="monotone" dataKey="downloaded" stroke="#f59e0b" name="Downloaded" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Report Types Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Report Types Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reportTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Generation Time Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Generation Time Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generationTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Most Active Users</h4>
          <div className="space-y-3">
            {userActivity.map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {user.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user.user}</p>
                    <p className="text-xs text-gray-500">{user.lastActive}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{user.reports}</p>
                  <p className="text-xs text-gray-500">reports</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Templates */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium mb-4">Popular Report Templates</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="pb-3">Template Name</th>
                <th className="pb-3">Usage Count</th>
                <th className="pb-3">Trend</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {popularTemplates.map((template, index) => (
                <tr key={index}>
                  <td className="py-3">
                    <p className="text-sm font-medium">{template.template}</p>
                  </td>
                  <td className="py-3">
                    <p className="text-sm">{template.usage}</p>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center text-xs ${
                      template.trend === 'up' ? 'text-green-600' :
                      template.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {template.trend === 'up' ? '↑' : template.trend === 'down' ? '↓' : '→'}
                      {template.trend}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}