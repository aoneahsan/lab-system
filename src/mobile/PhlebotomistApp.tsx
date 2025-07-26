import React, { useState } from 'react';
import { Home, Calendar, Package, QrCode, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { HomeScreen } from './screens/HomeScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { CollectionsScreen } from './screens/CollectionsScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ProfileScreen } from './screens/ProfileScreen';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'collections', label: 'Collections', icon: Package },
  { id: 'scan', label: 'Scan', icon: QrCode },
  { id: 'profile', label: 'Profile', icon: User },
];

export const PhlebotomistApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentUser } = useAuthStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'schedule':
        return <ScheduleScreen />;
      case 'collections':
        return <CollectionsScreen />;
      case 'scan':
        return <ScanScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">LabFlow Phlebotomist</h1>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 px-3 flex-1 ${
                  activeTab === tab.id
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};