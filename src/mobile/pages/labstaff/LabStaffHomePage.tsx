import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Activity, 
  Cpu, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  BarChart
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

interface DashboardStats {
  pendingResults: number;
  completedToday: number;
  qcDue: number;
  equipmentAlerts: number;
  criticalResults: number;
  tat: {
    average: string;
    onTime: number;
  };
}

const LabStaffHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  
  // Mock stats - in real app would fetch from API
  const [stats] = useState<DashboardStats>({
    pendingResults: 45,
    completedToday: 127,
    qcDue: 3,
    equipmentAlerts: 2,
    criticalResults: 5,
    tat: {
      average: '2.3 hrs',
      onTime: 92
    }
  });

  const quickActions = [
    {
      icon: FileText,
      title: 'Enter Results',
      subtitle: `${stats.pendingResults} pending`,
      color: 'bg-blue-500',
      path: '/results',
      priority: 'high'
    },
    {
      icon: Activity,
      title: 'QC Management',
      subtitle: `${stats.qcDue} due today`,
      color: 'bg-green-500',
      path: '/qc',
      priority: stats.qcDue > 0 ? 'medium' : 'low'
    },
    {
      icon: Cpu,
      title: 'Equipment',
      subtitle: `${stats.equipmentAlerts} alerts`,
      color: stats.equipmentAlerts > 0 ? 'bg-orange-500' : 'bg-gray-500',
      path: '/equipment',
      priority: stats.equipmentAlerts > 0 ? 'high' : 'low'
    },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'result',
      message: 'CBC completed for John Doe',
      time: '5 min ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'qc',
      message: 'Chemistry QC Level 2 passed',
      time: '15 min ago',
      status: 'passed'
    },
    {
      id: '3',
      type: 'critical',
      message: 'Critical glucose value - Jane Smith',
      time: '30 min ago',
      status: 'critical'
    },
    {
      id: '4',
      type: 'equipment',
      message: 'Analyzer A1 maintenance due',
      time: '1 hour ago',
      status: 'warning'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'result':
        return <FileText className="h-4 w-4" />;
      case 'qc':
        return <Activity className="h-4 w-4" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'equipment':
        return <Cpu className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'text-green-600 bg-green-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-purple-600 text-white px-6 pt-12 pb-20">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {currentUser?.displayName?.split(' ')[0] || 'Lab Tech'}
            </h1>
            <p className="text-purple-100 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart className="h-5 w-5 text-white/70" />
              <span className="text-xs text-white/70">TAT</span>
            </div>
            <p className="text-2xl font-bold">{stats.tat.average}</p>
            <p className="text-sm text-white/70">{stats.tat.onTime}% on time</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-white/70" />
              <span className="text-xs text-white/70">Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.completedToday}</p>
            <p className="text-sm text-white/70">Tests completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-10">
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-xl p-4 shadow-sm relative"
              >
                {action.priority === 'high' && stats[action.path === '/results' ? 'pendingResults' : 'equipmentAlerts'] > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {action.path === '/results' ? stats.pendingResults : stats.equipmentAlerts}
                  </div>
                )}
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500 mt-1">{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Critical Alerts */}
      {stats.criticalResults > 0 && (
        <div className="px-6 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    {stats.criticalResults} Critical Results Pending
                  </p>
                  <p className="text-sm text-red-700">Require immediate action</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/results?filter=critical')}
                className="text-sm font-medium text-red-600"
              >
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="flex-1 px-6 py-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabStaffHomePage;