import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  CreditCard,
  Bell,
  ChevronRight,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { unifiedNotificationService } from '@/services/unified-notification.service';
import { App } from '@capacitor/app';

const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [notifications] = useState(0);

  // Mock patient data - in real app, would fetch based on currentUser
  const _patientId = currentUser?.uid || '';
  // const { data: _patient } = usePatient(_patientId);

  useEffect(() => {
    setupPushNotifications();

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App became active, refresh data
        console.log('App became active');
      }
    });
  }, []);

  const setupPushNotifications = async () => {
    try {
      // Initialize unified notification service
      await unifiedNotificationService.initialize();
      
      // Request permission using notification-kit
      const granted = await unifiedNotificationService.requestPushPermission();

      if (granted) {
        console.log('Push notifications enabled');
        
        // Get push token if needed
        const token = await unifiedNotificationService.getPushToken();
        if (token) {
          console.log('Push registration success, token:', token);
        }
        
        // Notification count will be handled by NotificationCenter component
        // which subscribes to notification service
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  const quickActions = [
    {
      icon: Calendar,
      title: 'Book Appointment',
      subtitle: 'Schedule your next visit',
      color: 'bg-blue-500',
      path: '/appointments',
    },
    {
      icon: FileText,
      title: 'View Results',
      subtitle: 'Check your latest tests',
      color: 'bg-green-500',
      path: '/results',
      badge: 2, // New results
    },
    {
      icon: CreditCard,
      title: 'Payments',
      subtitle: 'Manage your bills',
      color: 'bg-purple-500',
      path: '/payments',
    },
  ];

  const recentActivity = [
    {
      type: 'result',
      title: 'Blood Test Results Ready',
      time: '2 hours ago',
      icon: FileText,
      urgent: false,
    },
    {
      type: 'appointment',
      title: 'Appointment Tomorrow',
      time: '10:00 AM - Dr. Smith',
      icon: Calendar,
      urgent: true,
    },
    {
      type: 'payment',
      title: 'Invoice #1234 Due',
      time: '$150.00',
      icon: CreditCard,
      urgent: false,
    },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 pt-12 pb-20">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Hello, {currentUser?.displayName?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-blue-100 mt-1">Welcome back to LabFlow</p>
          </div>
          <button onClick={() => navigate('/notifications')} className="relative p-2">
            <Bell className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
        </div>

        {/* Health Summary Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8" />
              <div>
                <p className="text-sm text-blue-100">Health Status</p>
                <p className="text-lg font-semibold">All Good</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5" />
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
                {action.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
                <div
                  className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500 mt-1">{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-1 px-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activity.urgent ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <Icon
                      className={`h-5 w-5 ${activity.urgent ? 'text-red-600' : 'text-gray-600'}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
                {activity.urgent && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="px-6 pb-20 mt-6">
        <div className="bg-red-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Emergency?</p>
              <p className="text-xs text-gray-600">Call lab 24/7</p>
            </div>
          </div>
          <a href="tel:+1234567890" className="text-red-600 font-medium text-sm">
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobileHomePage;
