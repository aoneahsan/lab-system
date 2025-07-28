import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Calendar, Shield, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        {
          icon: User,
          label: 'Full Name',
          value: currentUser?.displayName || 'Not set',
        },
        {
          icon: Mail,
          label: 'Email',
          value: currentUser?.email || 'Not set',
        },
        {
          icon: Phone,
          label: 'Phone',
          value: currentUser?.phoneNumber || 'Not set',
        },
        {
          icon: Calendar,
          label: 'Employee ID',
          value: currentUser?.employeeId || 'Not set',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Role',
          value: currentUser?.role || 'Phlebotomist',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {currentUser?.displayName || 'User'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">Phlebotomist</p>
      </div>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3 px-1">
            {section.title}
          </h3>
          <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <div key={itemIndex} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.value}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="space-y-3">
        <button className="w-full bg-white rounded-lg shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="font-medium text-gray-900">Change Password</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button className="w-full bg-white rounded-lg shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="font-medium text-gray-900">Notification Settings</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 rounded-lg p-4 flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;