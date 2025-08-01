import React, { useState } from 'react';
import { Home, Calendar, QrCode, Package, User } from 'lucide-react';
import {
  HomeScreen,
  CollectionScreen,
  ScanScreen,
  InventoryScreen,
  ProfileScreen,
} from './phlebotomist/screens';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'collection', label: 'Collection', icon: Calendar },
  { id: 'scan', label: 'Scan', icon: QrCode },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'profile', label: 'Profile', icon: User },
];

export const PhlebotomistApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'collection':
        return <CollectionScreen />;
      case 'scan':
        return <ScanScreen />;
      case 'inventory':
        return <InventoryScreen />;
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
          <h1 className="text-xl font-semibold text-gray-900">LabFlow Phlebotomist</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Zone: A</span>
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