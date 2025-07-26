import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  Activity, 
  User,
  Bell
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { HomeScreen } from './clinician/screens/HomeScreen';
import { PatientsScreen } from './clinician/screens/PatientsScreen';
import { OrdersScreen } from './clinician/screens/OrdersScreen';
import { ResultsScreen } from './clinician/screens/ResultsScreen';
import { ProfileScreen } from './clinician/screens/ProfileScreen';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const ClinicianApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentUser } = useAuthStore();
  
  // Mock notification count
  const [notificationCount] = useState(3);
  const [criticalCount] = useState(2);

  const tabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'orders', label: 'Orders', icon: FileText, badge: notificationCount },
    { id: 'results', label: 'Results', icon: Activity, badge: criticalCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'patients':
        return <PatientsScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              LabFlow Clinician
            </h1>
            <p className="text-xs text-gray-500">
              Welcome, Dr. {currentUser?.displayName?.split(' ').pop() || 'Smith'}
            </p>
          </div>
          <button className="relative p-2">
            <Bell className="h-5 w-5 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Screen Content */}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 px-3 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};