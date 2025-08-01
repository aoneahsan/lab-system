import React, { useState } from 'react';
import { Home, Users, ClipboardList, Activity, User } from 'lucide-react';
import {
  HomeScreen,
  PatientsScreen,
  OrdersScreen,
  ResultsScreen,
  ProfileScreen,
} from './clinician/screens';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'results', label: 'Results', icon: Activity },
  { id: 'profile', label: 'Profile', icon: User },
];

export const ClinicianApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
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
      <header className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">LabFlow Clinician</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Dr. {localStorage.getItem('clinicianName') || 'Smith'}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="overflow-y-auto flex-1">{renderContent()}</main>

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
                  activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="mt-1 text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};