import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TestTube2, 
  ClipboardCheck, 
  AlertCircle, 
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Activity
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const stats = [
    { label: 'Pending Samples', value: '23', icon: TestTube2, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Processing', value: '8', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { label: 'Completed Today', value: '45', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { label: 'Critical Queue', value: '3', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
  ];

  const recentSamples = [
    {
      id: 'LAB001',
      patientName: 'John Doe',
      patientMrn: 'MRN123456',
      tests: ['CBC', 'Lipid Panel'],
      priority: 'stat',
      status: 'processing',
      receivedTime: '10 mins ago',
    },
    {
      id: 'LAB002',
      patientName: 'Jane Smith',
      patientMrn: 'MRN123457',
      tests: ['HbA1c', 'Glucose'],
      priority: 'routine',
      status: 'pending',
      receivedTime: '25 mins ago',
    },
    {
      id: 'LAB003',
      patientName: 'Bob Johnson',
      patientMrn: 'MRN123458',
      tests: ['Blood Culture'],
      priority: 'urgent',
      status: 'pending',
      receivedTime: '30 mins ago',
    },
  ];

  const qualityMetrics = [
    { label: 'TAT Compliance', value: '94%', trend: '+2%' },
    { label: 'Error Rate', value: '0.3%', trend: '-0.1%' },
    { label: 'Critical Callback', value: '100%', trend: '0%' },
    { label: 'Sample Rejection', value: '2.1%', trend: '-0.5%' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6">
        <h1 className="text-2xl font-bold">
          Welcome, {currentUser?.firstName || 'Lab Tech'}
        </h1>
        <p className="text-purple-100 mt-1">
          Lab Station 3 " {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 -mt-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-5 w-5 text-gray-600" />
                <span className={`text-xs px-2 py-1 rounded-full ${stat.color}`}>
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Priority Queue */}
      <div className="px-4 pb-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-orange-900">Priority Queue</h3>
            <span className="text-sm text-orange-700">3 STAT orders</span>
          </div>
          <button 
            onClick={() => navigate('/labstaff/samples?filter=stat')}
            className="w-full btn btn-primary btn-sm"
          >
            Process Priority Samples
          </button>
        </div>
      </div>

      {/* Recent Samples */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Samples</h2>
          <button 
            onClick={() => navigate('/labstaff/samples')}
            className="text-sm text-indigo-600 font-medium"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentSamples.map((sample) => (
            <div
              key={sample.id}
              className="bg-white rounded-lg shadow-sm p-4"
              onClick={() => navigate(`/labstaff/sample/${sample.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{sample.id}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(sample.priority)}`}>
                      {sample.priority.toUpperCase()}
                    </span>
                    {getStatusIcon(sample.status)}
                  </div>
                  <p className="text-sm text-gray-600">{sample.patientName} " {sample.patientMrn}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tests: {sample.tests.join(', ')}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{sample.receivedTime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quality Metrics</h2>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 gap-3">
            {qualityMetrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.label}</p>
                <p className="text-xs text-green-600">{metric.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/labstaff/scan')}
            className="bg-indigo-600 text-white p-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            Scan Sample
          </button>
          <button 
            onClick={() => navigate('/labstaff/qc')}
            className="bg-white border border-gray-300 text-gray-700 p-4 rounded-lg font-medium hover:bg-gray-50"
          >
            Run QC
          </button>
        </div>
      </div>
    </div>
  );
};