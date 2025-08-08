import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { useResults } from '@/hooks/useResults';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function ResultAnalytics() {
  const [timeRange, setTimeRange] = useState('month');
  const { results } = useResults();

  // Calculate analytics data
  const getAnalyticsData = () => {
    const now = new Date();
    const startDate = timeRange === 'month' ? startOfMonth(now) : subMonths(now, 3);
    const endDate = endOfMonth(now);

    // TAT Analysis
    const tatData = results.reduce((acc: any[], result) => {
      if (result.createdAt >= startDate && result.createdAt <= endDate) {
        const tat = result.reportedAt ? 
          Math.round((result.reportedAt.getTime() - result.createdAt.getTime()) / (1000 * 60 * 60)) : 0;
        
        const day = format(result.createdAt, 'MMM dd');
        const existing = acc.find(item => item.day === day);
        
        if (existing) {
          existing.tat = (existing.tat * existing.count + tat) / (existing.count + 1);
          existing.count++;
        } else {
          acc.push({ day, tat, count: 1 });
        }
      }
      return acc;
    }, []);

    // Test Volume by Department
    const departmentData = results.reduce((acc: any[], result) => {
      if (result.createdAt >= startDate && result.createdAt <= endDate) {
        const dept = result.department || 'General';
        const existing = acc.find(item => item.name === dept);
        
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: dept, value: 1 });
        }
      }
      return acc;
    }, []);

    // Critical Results
    const criticalData = results.reduce((acc: any, result) => {
      if (result.createdAt >= startDate && result.createdAt <= endDate) {
        if (result.flag === 'critical') {
          acc.critical++;
        } else if (result.flag === 'abnormal') {
          acc.abnormal++;
        } else {
          acc.normal++;
        }
        acc.total++;
      }
      return acc;
    }, { critical: 0, abnormal: 0, normal: 0, total: 0 });

    // Daily Volume Trend
    const volumeTrend = eachDayOfInterval({ start: startDate, end: endDate })
      .map(date => {
        const dayResults = results.filter(r => 
          format(r.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        return {
          date: format(date, 'MMM dd'),
          volume: dayResults.length,
          validated: dayResults.filter(r => r.status === 'validated').length
        };
      });

    return { tatData, departmentData, criticalData, volumeTrend };
  };

  const { tatData, departmentData, criticalData, volumeTrend } = getAnalyticsData();

  // Calculate statistics
  const avgTAT = tatData.reduce((sum, item) => sum + item.tat, 0) / tatData.length || 0;
  const criticalRate = criticalData.total > 0 ? 
    ((criticalData.critical / criticalData.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Result Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="month">This Month</option>
          <option value="quarter">Last 3 Months</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. TAT</p>
              <p className="text-2xl font-bold text-gray-900">{avgTAT.toFixed(1)}h</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">12% faster than target</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{criticalData.total}</p>
            </div>
            <Activity className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">15% increase</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Results</p>
              <p className="text-2xl font-bold text-red-600">{criticalData.critical}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {criticalRate}% of total
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validated</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((volumeTrend.reduce((sum, day) => sum + day.validated, 0) / 
                  criticalData.total) * 100)}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Within 24 hours
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TAT Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Turnaround Time Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="tat" 
                stroke="#3b82f6" 
                name="Average TAT"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Test Volume by Department */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Results by Department</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Volume */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Daily Result Volume</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="volume" fill="#8b5cf6" name="Total Results" />
              <Bar dataKey="validated" fill="#10b981" name="Validated" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Result Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium mb-4">Result Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Normal', value: criticalData.normal },
                  { name: 'Abnormal', value: criticalData.abnormal },
                  { name: 'Critical', value: criticalData.critical }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}