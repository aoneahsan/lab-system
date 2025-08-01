import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Home, 
  TestTube2, 
  ClipboardCheck, 
  Barcode, 
  User 
} from 'lucide-react';
import {
  HomeScreen,
  SamplesScreen,
  ProcessingScreen,
  VerificationScreen,
  ProfileScreen,
} from './labstaff/screens';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

export const LabStaffApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const tabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home, component: HomeScreen },
    { id: 'samples', label: 'Samples', icon: TestTube2, component: SamplesScreen },
    { id: 'processing', label: 'Process', icon: ClipboardCheck, component: ProcessingScreen },
    { id: 'verification', label: 'Verify', icon: Barcode, component: VerificationScreen },
    { id: 'profile', label: 'Profile', icon: User, component: ProfileScreen },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || HomeScreen;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-hidden">
        <ActiveComponent />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive 
                    ? 'text-indigo-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Outlet />
    </div>
  );
};