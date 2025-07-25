import React, { useState } from 'react';
import { Home, Calendar, Package, QrCode, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

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

// Home Screen Component
const HomeScreen: React.FC = () => {
  const { currentUser } = useAuthStore();

  return (
    <div className="p-4 space-y-4">
      {/* Welcome Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome, {currentUser?.displayName || 'Phlebotomist'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Today's collection schedule
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <p className="text-3xl font-bold text-indigo-600">12</p>
          <p className="text-sm text-gray-600">Scheduled</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">8</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
      </div>

      {/* Next Appointments */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Next Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">John Doe</p>
                <p className="text-sm text-gray-500">Blood Test - CBC, Lipid Panel</p>
                <p className="text-xs text-gray-400 mt-1">9:30 AM - Room 101</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In 15 min</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">Jane Smith</p>
                <p className="text-sm text-gray-500">Glucose Test</p>
                <p className="text-xs text-gray-400 mt-1">10:00 AM - Room 102</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">10:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Screen Component
const ScheduleScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
      
      {/* Time Slots */}
      <div className="space-y-3">
        {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'].map((time) => (
          <div key={time} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">{time}</p>
                <p className="font-medium text-gray-900 mt-1">Patient Name</p>
                <p className="text-sm text-gray-500">Tests: CBC, Chemistry Panel</p>
                <p className="text-xs text-gray-400 mt-1">Location: Room 101</p>
              </div>
              <button className="text-indigo-600 text-sm font-medium">Start</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Collections Screen Component
const CollectionsScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('pending');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Sample Collections</h2>
      
      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => setActiveFilter('pending')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
            activeFilter === 'pending' ? 'bg-white' : 'text-gray-600'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveFilter('collected')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
            activeFilter === 'collected' ? 'bg-white' : 'text-gray-600'
          }`}
        >
          Collected
        </button>
      </div>

      {/* Collection List */}
      <div className="space-y-3">
        {activeFilter === 'pending' ? (
          <>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-500">Order #ORD001</p>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">STAT</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="h-4 w-4 rounded border-2 border-gray-300 mr-2" />
                  <span>CBC - Purple top (EDTA)</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="h-4 w-4 rounded border-2 border-gray-300 mr-2" />
                  <span>Chemistry - Gold top (SST)</span>
                </div>
              </div>
              <button className="w-full mt-3 py-2 bg-indigo-600 text-white rounded text-sm font-medium">
                Start Collection
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">Jane Smith</p>
                  <p className="text-sm text-gray-500">Order #ORD002</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Collected: 8:45 AM</p>
                <p>Samples: 2 tubes</p>
                <p>Storage: Refrigerated</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Scan Screen Component
const ScanScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Scan Sample</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <QrCode className="h-32 w-32 text-gray-400" />
        </div>
        <p className="text-center text-gray-600 mb-4">
          Position the barcode or QR code within the frame
        </p>
        <button className="w-full py-3 bg-indigo-600 text-white rounded font-medium">
          Open Camera
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-2">Manual Entry</h3>
        <input
          type="text"
          placeholder="Enter sample number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button className="w-full mt-2 py-2 bg-gray-100 text-gray-700 rounded font-medium">
          Search
        </button>
      </div>
    </div>
  );
};

// Profile Screen Component
const ProfileScreen: React.FC = () => {
  const { currentUser } = useAuthStore();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{currentUser?.displayName || 'Phlebotomist'}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            <p className="text-xs text-gray-400 mt-1">Employee ID: PH001</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-3">Today's Performance</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Collections Completed</span>
            <span className="font-medium">8/12</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Success Rate</span>
            <span className="font-medium text-green-600">100%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Average Time</span>
            <span className="font-medium">4.5 min</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
        <button className="w-full p-4 text-left flex justify-between items-center">
          <span className="font-medium">Training & Certifications</span>
          <span className="text-gray-400">›</span>
        </button>
        <button className="w-full p-4 text-left flex justify-between items-center">
          <span className="font-medium">Settings</span>
          <span className="text-gray-400">›</span>
        </button>
      </div>

      <button className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg font-medium">
        Sign Out
      </button>
    </div>
  );
};