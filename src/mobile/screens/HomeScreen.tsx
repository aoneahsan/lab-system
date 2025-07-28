import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ClipboardList, BarChart3 } from 'lucide-react';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Today\'s Collections', value: '12', icon: ClipboardList },
    { label: 'Completed', value: '8', icon: BarChart3 },
    { label: 'Pending', value: '4', icon: Calendar },
    { label: 'Routes', value: '2', icon: MapPin },
  ];

  const quickActions = [
    { 
      title: 'Start Collection', 
      icon: ClipboardList,
      path: '/phlebotomist/collections',
      color: 'bg-blue-500'
    },
    { 
      title: 'View Schedule', 
      icon: Calendar,
      path: '/phlebotomist/schedule',
      color: 'bg-green-500'
    },
    { 
      title: 'Scan Sample', 
      icon: BarChart3,
      path: '/phlebotomist/scan',
      color: 'bg-purple-500'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`w-full ${action.color} text-white rounded-lg p-4 flex items-center justify-between hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-6 w-6" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Collections</h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Patient {item}</p>
                  <p className="text-sm text-gray-600">Order #2024{item}234</p>
                </div>
                <span className="text-sm text-green-600">Completed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;