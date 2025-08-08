import React, { useState, useEffect } from 'react';
import { Home, FileText, Calendar, User, Bell, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  HomeScreen,
  ResultsScreen,
  AppointmentsScreen,
  NotificationsScreen,
  ProfileScreen,
} from './patient/screens';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export const PatientApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  useEffect(() => {
    // Configure status bar for mobile
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      SplashScreen.hide();
    }
  }, []);

  const handleTabChange = async (tabId: string) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    setPreviousTab(activeTab);
    setActiveTab(tabId);
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
        return <NotificationsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with safe area */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 pt-safe pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {previousTab && (
                <button
                  onClick={() => {
                    setActiveTab(previousTab);
                    setPreviousTab(null);
                  }}
                  className="-ml-2 p-2"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">LabFlow Patient</h1>
            </div>
            <button
              onClick={() => handleTabChange('notifications')}
              className="relative p-2"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{unreadNotifications}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content with pull-to-refresh support */}
      <main className="overflow-y-auto flex-1 overscroll-contain">
        <div className="min-h-full">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation with safe area */}
      <nav className="bg-white border-t border-gray-200">
        <div className="flex justify-around pb-safe">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center py-2 px-3 flex-1 transition-colors ${
                  isActive
                    ? 'text-indigo-600'
                    : 'text-gray-500 active:text-gray-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {tab.id === 'notifications' && unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full" />
                  )}
                </div>
                <span className="mt-1 text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

