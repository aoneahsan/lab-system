import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Award,
  Shield,
  Bell,
  BarChart,
  HelpCircle,
  LogOut,
  ChevronRight,
  Briefcase,
  Calendar,
  Star,
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
      action: () => navigate('/clinician/profile/personal'),
    },
    {
      icon: Briefcase,
      label: 'Professional Details',
      description: 'Licenses, certifications, specialties',
      action: () => navigate('/clinician/profile/professional'),
    },
    {
      icon: Calendar,
      label: 'Availability & Schedule',
      description: 'Manage your clinic hours',
      action: () => navigate('/clinician/profile/schedule'),
    },
    {
      icon: BarChart,
      label: 'Performance Metrics',
      description: 'View your lab utilization stats',
      action: () => navigate('/clinician/profile/metrics'),
    },
    {
      icon: Bell,
      label: 'Notification Preferences',
      description: 'Configure alerts and reminders',
      action: () => navigate('/clinician/profile/notifications'),
    },
    {
      icon: Shield,
      label: 'Security Settings',
      description: 'Password and authentication',
      action: () => navigate('/clinician/profile/security'),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'FAQs and contact support',
      action: () => navigate('/clinician/profile/help'),
    },
  ];

  const stats = [
    { label: 'Patients', value: '156', trend: '+12 this month' },
    { label: 'Orders', value: '423', trend: 'This month' },
    { label: 'Critical Results', value: '98%', trend: 'Review rate' },
    { label: 'Avg TAT', value: '1.2d', trend: 'Turnaround time' },
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
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              Dr. {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-blue-100">Internal Medicine</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="h-4 w-4 text-yellow-300 fill-current" />
              <span className="text-sm text-blue-200">License: CA12345</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-blue-100">{stat.label}</p>
                </div>
                <p className="text-xs text-blue-200">{stat.trend}</p>
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
              <Award className="h-6 w-6 text-indigo-600 mb-1" />
              <span className="text-xs font-medium">CME Credits</span>
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
          LabFlow Clinician v1.0.0
        </p>
      </div>
    </div>
  );
};