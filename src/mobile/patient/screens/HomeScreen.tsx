import React, { useState, useCallback } from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  CreditCard,
  Users,
  Activity,
  Bell,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useOfflinePatients } from '@/hooks/useOfflinePatients';
import { formatDistanceToNow } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useQueryClient } from '@tanstack/react-query';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { data: recentResults, refetch } = useOfflinePatients({ limit: 3 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({ queryKey: ['results'] }),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      ]);
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [queryClient, refetch]);

  const handleQuickAction = async (route: string) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    navigate(route);
  };

  const quickActions = [
    {
      id: 'results',
      label: 'View Results',
      icon: FileText,
      color: 'indigo',
      route: '/patient/results',
    },
    {
      id: 'appointments',
      label: 'Book Test',
      icon: Calendar,
      color: 'green',
      route: '/patient/appointments/new',
    },
    {
      id: 'locations',
      label: 'Find Lab',
      icon: MapPin,
      color: 'blue',
      route: '/patient/locations',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      color: 'purple',
      route: '/patient/payments',
    },
  ];

  const features = [
    {
      id: 'family',
      label: 'Family Members',
      icon: Users,
      description: 'Manage family health records',
      route: '/patient/family',
    },
    {
      id: 'health-tracker',
      label: 'Health Tracker',
      icon: Activity,
      description: 'Track your health metrics',
      route: '/patient/health-tracker',
    },
    {
      id: 'reminders',
      label: 'Test Reminders',
      icon: Bell,
      description: 'Set up test reminders',
      route: '/patient/reminders',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 relative">
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-4 z-10">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
          </div>
        </div>
      )}
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
        <h1 className="text-2xl font-bold">
          Hello, {currentUser?.displayName?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-indigo-100 mt-1">Your health journey at your fingertips</p>

        {/* Health Score Card */}
        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-100">Health Score</p>
              <p className="text-2xl font-bold">85/100</p>
            </div>
            <Activity className="h-8 w-8 text-white/80" />
          </div>
          <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.route)}
                className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center active:scale-95 transition-all"
              >
                <div className={`p-3 rounded-full mb-2 ${
                  action.color === 'indigo' ? 'bg-indigo-50' :
                  action.color === 'green' ? 'bg-green-50' :
                  action.color === 'blue' ? 'bg-blue-50' :
                  'bg-purple-50'
                }`}>
                  <action.icon className={`h-6 w-6 ${
                    action.color === 'indigo' ? 'text-indigo-600' :
                    action.color === 'green' ? 'text-green-600' :
                    action.color === 'blue' ? 'text-blue-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <span className="text-sm font-medium text-gray-900">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Test Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
            <button
              onClick={() => navigate('/patient/results')}
              className="text-sm text-indigo-600 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {recentResults && recentResults.length > 0 ? (
              recentResults.map((result: any) => (
                <div
                  key={result.id}
                  onClick={async () => {
                    if (Capacitor.isNativePlatform()) {
                      await Haptics.impact({ style: ImpactStyle.Light });
                    }
                    navigate(`/patient/results/${result.id}`);
                  }}
                  className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{result.testName}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(result.resultDate.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${
                        result.status === 'ready' ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {result.status === 'ready' ? 'Ready' : 'Processing'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent test results</p>
                <button
                  onClick={() => navigate('/patient/appointments/new')}
                  className="mt-3 text-indigo-600 font-medium"
                >
                  Book your first test
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">More Features</h2>
          <div className="space-y-2">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => handleQuickAction(feature.route)}
                className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between active:bg-gray-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <feature.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{feature.label}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-indigo-900">Upcoming Appointment</p>
              <p className="text-sm text-indigo-700 mt-1">
                Blood Test Collection - Tomorrow at 9:00 AM
              </p>
              <button 
                onClick={() => handleQuickAction('/patient/appointments')}
                className="mt-2 text-sm text-indigo-600 font-medium active:text-indigo-700"
              >
                View Details →
              </button>
            </div>
          </div>
        </div>

        {/* Add some bottom padding for safe area */}
        <div className="h-8" />
      </div>
    </div>
  );
};
