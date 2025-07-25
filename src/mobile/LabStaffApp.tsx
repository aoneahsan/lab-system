import React, { useState } from 'react';
import { Home, TestTube, ClipboardCheck, BarChart3, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'samples', label: 'Samples', icon: TestTube },
  { id: 'results', label: 'Results', icon: ClipboardCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export const LabStaffApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentUser } = useAuthStore();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-900">LabFlow Staff</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Welcome, {currentUser?.displayName || 'Lab Staff'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Today's lab overview</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-3xl font-bold text-indigo-600">45</p>
                <p className="text-sm text-gray-600">Pending Samples</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-3xl font-bold text-green-600">123</p>
                <p className="text-sm text-gray-600">Completed Today</p>
              </div>
            </div>
          </div>
        )}
      </main>

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