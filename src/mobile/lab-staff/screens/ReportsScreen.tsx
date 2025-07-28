import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Activity,
  FileText,
  Download,
  Calendar,
  Filter,
  PieChart,
  Users,
  AlertCircle,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  CheckCircle,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface DepartmentStats {
  department: string;
  samplesProcessed: number;
  tat: number;
  criticalResults: number;
}

export const ReportsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedReport, setSelectedReport] = useState('performance');

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    {
      label: 'Total Samples',
      value: 156,
      unit: 'samples',
      trend: 'up',
      change: 12,
    },
    {
      label: 'Average TAT',
      value: 42,
      unit: 'minutes',
      trend: 'down',
      change: -8,
    },
    {
      label: 'QC Pass Rate',
      value: 98.5,
      unit: '%',
      trend: 'stable',
      change: 0.5,
    },
    {
      label: 'Critical Results',
      value: 7,
      unit: 'alerts',
      trend: 'up',
      change: 3,
    },
  ]);

  const [departmentStats] = useState<DepartmentStats[]>([
    {
      department: 'Chemistry',
      samplesProcessed: 78,
      tat: 35,
      criticalResults: 3,
    },
    {
      department: 'Hematology',
      samplesProcessed: 45,
      tat: 25,
      criticalResults: 2,
    },
    {
      department: 'Immunology',
      samplesProcessed: 23,
      tat: 55,
      criticalResults: 1,
    },
    {
      department: 'Microbiology',
      samplesProcessed: 10,
      tat: 120,
      criticalResults: 1,
    },
  ]);

  const reportTypes = [
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'tat', label: 'TAT Analysis', icon: Clock },
    { id: 'workload', label: 'Workload', icon: Activity },
    { id: 'quality', label: 'Quality', icon: BarChart3 },
  ];

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <ArrowUp className={`h-4 w-4 ${change > 0 ? 'text-green-500' : 'text-red-500'}`} />;
    } else if (trend === 'down') {
      return <ArrowDown className={`h-4 w-4 ${change < 0 ? 'text-green-500' : 'text-red-500'}`} />;
    }
    return null;
  };

  const getChangeColor = (label: string, change: number) => {
    // For TAT, negative change is good
    if (label.includes('TAT') && change < 0) return 'text-green-600';
    if (label.includes('TAT') && change > 0) return 'text-red-600';

    // For most metrics, positive change is good
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Reports & Analytics</h1>
            <button className="p-2 text-gray-600">
              <Download className="h-5 w-5" />
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-2 mb-4">
            {['today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                  selectedPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Report Type Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedReport === type.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-gray-600">{metric.label}</p>
                {getTrendIcon(metric.trend, metric.change)}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {metric.value}
                <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
              </p>
              <p className={`text-xs mt-1 ${getChangeColor(metric.label, metric.change)}`}>
                {metric.change > 0 ? '+' : ''}
                {metric.change}
                {metric.unit === '%' ? '%' : ''} from yesterday
              </p>
            </div>
          ))}
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Department Performance</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {departmentStats.map((dept, index) => (
              <div
                key={index}
                onClick={() =>
                  navigate(`/lab-staff/reports/department/${dept.department.toLowerCase()}`)
                }
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{dept.department}</h4>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Samples</p>
                    <p className="font-semibold">{dept.samplesProcessed}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg TAT</p>
                    <p className="font-semibold">{dept.tat} min</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Critical</p>
                    <p className="font-semibold text-red-600">{dept.criticalResults}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Highlights</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">On-Time Delivery</p>
                  <p className="text-sm text-gray-500">Meeting TAT targets</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-green-600">94%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Staff Productivity</p>
                  <p className="text-sm text-gray-500">Samples per technician</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">28</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Repeat Rate</p>
                  <p className="text-sm text-gray-500">Tests requiring repeat</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-yellow-600">2.1%</span>
            </div>
          </div>
        </div>

        {/* Generate Report Button */}
        <button
          onClick={() => navigate('/lab-staff/reports/generate')}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <FileText className="h-5 w-5" />
          <span>Generate Custom Report</span>
        </button>
      </div>
    </div>
  );
};
