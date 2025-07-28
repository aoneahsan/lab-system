import React, { useState, useEffect } from 'react';
import { Home, FileText, Calendar, User, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useOffline } from '@/hooks/useOffline';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const PatientMobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentUser } = useAuthStore();
  const { isOffline, pendingChanges } = useOffline();
  const [notificationCount, setNotificationCount] = useState(3);

  const tabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'results', label: 'Results', icon: FileText },
    { id: 'appointments', label: 'Appts', icon: Calendar },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: notificationCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  useEffect(() => {
    // Set up push notifications
    setupPushNotifications();

    // Check for app updates
    checkForUpdates();
  }, []);

  const setupPushNotifications = async () => {
    // Implementation for push notifications
    console.log('Setting up push notifications');
  };

  const checkForUpdates = async () => {
    // Implementation for checking app updates
    console.log('Checking for app updates');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'appointments':
        return <AppointmentsScreen />;
      case 'notifications':
        return <NotificationsScreen onRead={() => setNotificationCount(0)} />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Status Bar Space (for iOS) */}
      <div className="h-safe-top bg-gradient-to-br from-indigo-500 to-purple-600" />

      {/* Header */}
      <header className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">LabFlow</h1>
          <div className="flex items-center space-x-3">
            {isOffline && (
              <div className="flex items-center bg-white/20 px-2 py-1 rounded-full">
                <div className="h-2 w-2 bg-yellow-400 rounded-full mr-1.5" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            {pendingChanges > 0 && (
              <div className="bg-white/20 px-2 py-1 rounded-full">
                <span className="text-xs">{pendingChanges} pending</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">{renderContent()}</main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 pb-safe">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center py-2 px-3 flex-1 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
