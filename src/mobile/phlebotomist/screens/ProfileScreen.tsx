import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Award,
  Clock,
  ChevronRight,
  LogOut,
  Shield,
  Bell,
  Calendar,
  BarChart,
  HelpCircle,
  Phone
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { logger } from '@/services/logger.service';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      icon: User,
      label: 'Personal Information',
      description: 'Update your profile details',
      action: () => navigate('/phlebotomist/profile/personal'),
    },
    {
      icon: Clock,
      label: 'Work Schedule',
      description: 'View your shifts and availability',
      action: () => navigate('/phlebotomist/profile/schedule'),
    },
    {
      icon: Award,
      label: 'Performance & Certifications',
      description: 'Track your metrics and credentials',
      action: () => navigate('/phlebotomist/profile/performance'),
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage your alert preferences',
      action: () => navigate('/phlebotomist/profile/notifications'),
    },
    {
      icon: Shield,
      label: 'Security',
      description: 'Password and biometric settings',
      action: () => navigate('/phlebotomist/profile/security'),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'FAQs and contact support',
      action: () => navigate('/phlebotomist/profile/help'),
    },
  ];

  const performanceStats = [
    { label: 'Collections Today', value: '12', trend: '+2' },
    { label: 'Success Rate', value: '98%', trend: '+1%' },
    { label: 'Avg Collection Time', value: '8m', trend: '-30s' },
    { label: 'Patient Rating', value: '4.8', trend: '0' },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
      toast.success('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      toast.error('Logout Failed', 'Unable to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-indigo-100">Phlebotomist</p>
            <p className="text-sm text-indigo-200 mt-1">Employee ID: PHB{currentUser?.id?.slice(-6)}</p>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {performanceStats.map((stat) => (
            <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-indigo-100">{stat.label}</p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-xl font-bold">{stat.value}</p>
                {stat.trend !== '0' && (
                  <span className={`text-xs ${
                    stat.trend.startsWith('+') ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 -mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50">
              <Calendar className="h-6 w-6 text-indigo-600 mb-1" />
              <span className="text-xs font-medium">Schedule</span>
            </button>
            <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50">
              <BarChart className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-xs font-medium">Reports</span>
            </button>
            <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50">
              <Phone className="h-6 w-6 text-blue-600 mb-1" />
              <span className="text-xs font-medium">Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 pt-0">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
        >
          <LogOut className="h-5 w-5" />
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>

      {/* App Version */}
      <div className="pb-4 text-center">
        <p className="text-xs text-gray-400">
          LabFlow Phlebotomist v1.0.0
        </p>
      </div>
    </div>
  );
};