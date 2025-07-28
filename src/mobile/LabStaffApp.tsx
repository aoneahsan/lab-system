import React, { useState } from 'react';
import { Home, TestTube, ClipboardCheck, BarChart3, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { HomeScreen } from './lab-staff/screens/HomeScreen';
import { ProcessingScreen } from './lab-staff/screens/ProcessingScreen';
import { QualityControlScreen } from './lab-staff/screens/QualityControlScreen';
import { ReportsScreen } from './lab-staff/screens/ReportsScreen';
import { ProfileScreen } from './lab-staff/screens/ProfileScreen';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const LabStaffApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentUser } = useAuthStore();
  const [pendingCount] = useState(12);

  const tabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'processing', label: 'Process', icon: TestTube, badge: pendingCount },
    { id: 'qc', label: 'QC', icon: ClipboardCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'processing':
        return <ProcessingScreen />;
      case 'qc':
        return <QualityControlScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Status Bar Space (for iOS) */}
      <div className="h-safe-top bg-gradient-to-br from-blue-600 to-indigo-700" />

      {/* Header */}
      <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">LabFlow Lab</h1>
            <p className="text-xs text-blue-100">{currentUser?.displayName || 'Lab Technician'}</p>
          </div>
          <div className="text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
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
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
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
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
