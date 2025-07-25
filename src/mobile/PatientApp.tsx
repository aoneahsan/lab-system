import React, { useState } from 'react';
import { Home, FileText, Calendar, User, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

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
  const { currentUser } = useAuthStore();

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">LabFlow Patient</h1>
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
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
          Welcome back, {currentUser?.displayName || 'Patient'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Your health journey at your fingertips
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
          <FileText className="h-8 w-8 text-indigo-600 mb-2" />
          <span className="text-sm font-medium">View Results</span>
        </button>
        <button className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
          <Calendar className="h-8 w-8 text-green-600 mb-2" />
          <span className="text-sm font-medium">Book Test</span>
        </button>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Recent Test Results</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Complete Blood Count</p>
              <p className="text-sm text-gray-500">Oct 25, 2024</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Ready</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Lipid Panel</p>
              <p className="text-sm text-gray-500">Oct 23, 2024</p>
            </div>
            <span className="text-sm text-yellow-600 font-medium">Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Results Screen Component
const ResultsScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
      
      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <button className="flex-1 py-2 px-3 bg-white rounded text-sm font-medium">All</button>
        <button className="flex-1 py-2 px-3 text-sm text-gray-600">Recent</button>
        <button className="flex-1 py-2 px-3 text-sm text-gray-600">Pending</button>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Complete Blood Count</h3>
                <p className="text-sm text-gray-500 mt-1">Ordered by Dr. Smith</p>
                <p className="text-xs text-gray-400 mt-1">Oct {20 + i}, 2024</p>
              </div>
              <button className="text-indigo-600 text-sm font-medium">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Appointments Screen Component
const AppointmentsScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
          <h3 className="font-medium text-indigo-900">Upcoming Appointment</h3>
        </div>
        <div className="p-4">
          <p className="font-medium text-gray-900">Blood Test Collection</p>
          <p className="text-sm text-gray-600 mt-1">Tomorrow, Oct 27, 2024</p>
          <p className="text-sm text-gray-600">9:00 AM - Lab Location A</p>
          <div className="flex space-x-2 mt-3">
            <button className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded text-sm font-medium">
              View Details
            </button>
            <button className="flex-1 py-2 px-3 border border-gray-300 rounded text-sm font-medium">
              Reschedule
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <p className="text-center text-gray-500">No other appointments scheduled</p>
        <button className="w-full mt-3 py-2 px-4 bg-indigo-600 text-white rounded font-medium">
          Book New Appointment
        </button>
      </div>
    </div>
  );
};

// Notifications Screen Component
const NotificationsScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
      
      <div className="space-y-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Test Results Ready</p>
              <p className="text-sm text-gray-600 mt-1">Your CBC test results are now available</p>
              <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
            </div>
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-medium text-gray-900">Appointment Reminder</p>
          <p className="text-sm text-gray-600 mt-1">Blood test collection tomorrow at 9:00 AM</p>
          <p className="text-xs text-gray-400 mt-1">Yesterday</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-medium text-gray-900">Health Tip</p>
          <p className="text-sm text-gray-600 mt-1">Remember to fast for 12 hours before your lipid panel test</p>
          <p className="text-xs text-gray-400 mt-1">2 days ago</p>
        </div>
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
            <p className="font-medium text-gray-900">{currentUser?.displayName || 'Patient'}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
        <button className="w-full p-4 text-left flex justify-between items-center">
          <span className="font-medium">Personal Information</span>
          <span className="text-gray-400">›</span>
        </button>
        <button className="w-full p-4 text-left flex justify-between items-center">
          <span className="font-medium">Medical History</span>
          <span className="text-gray-400">›</span>
        </button>
        <button className="w-full p-4 text-left flex justify-between items-center">
          <span className="font-medium">Insurance Information</span>
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