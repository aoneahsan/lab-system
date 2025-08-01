import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Award,
  BarChart,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Clock,
  TestTube2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      icon: User,
      label: 'Personal Information',
      description: 'Update your profile details',
      action: () => navigate('/labstaff/profile/personal'),
    },
    {
      icon: Award,
      label: 'Certifications',
      description: 'Manage your lab certifications',
      action: () => navigate('/labstaff/profile/certifications'),
    },
    {
      icon: Clock,
      label: 'Shift Schedule',
      description: 'View your work schedule',
      action: () => navigate('/labstaff/profile/schedule'),
    },
    {
      icon: BarChart,
      label: 'Performance Metrics',
      description: 'View your productivity stats',
      action: () => navigate('/labstaff/profile/metrics'),
    },
    {
      icon: Bell,
      label: 'Notification Settings',
      description: 'Configure alerts and reminders',
      action: () => navigate('/labstaff/profile/notifications'),
    },
    {
      icon: Shield,
      label: 'Security Settings',
      description: 'Password and authentication',
      action: () => navigate('/labstaff/profile/security'),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'FAQs and contact support',
      action: () => navigate('/labstaff/profile/help'),
    },
  ];

  const performanceStats = [
    { label: 'Samples Today', value: '45', icon: TestTube2, trend: '+5' },
    { label: 'Avg TAT', value: '32m', icon: Clock, trend: '-3m' },
    { label: 'Accuracy Rate', value: '99.8%', icon: CheckCircle, trend: '0%' },
    { label: 'Error Rate', value: '0.2%', icon: AlertTriangle, trend: '-0.1%' },
  ];

  const recentAchievements = [
    { title: 'Speed Champion', description: 'Fastest TAT this week', date: '2 days ago' },
    { title: '100 Samples', description: 'Processed 100 samples in a day', date: '1 week ago' },
    { title: 'Zero Errors', description: 'Perfect accuracy for 30 days', date: '1 month ago' },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
      toast.success('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout Failed', 'Unable to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p className="text-purple-100">Lab Technician II</p>
            <p className="text-sm text-purple-200 mt-1">Station 3 " Shift A</p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {performanceStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-white/80" />
                  <span className="text-xs text-purple-200">{stat.trend}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-purple-100">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Recent Achievements</h3>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {recentAchievements.map((achievement, index) => (
            <div
              key={index}
              className="p-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{achievement.title}</p>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{achievement.date}</p>
              </div>
            </div>
          ))}
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
          LabFlow Lab Staff v1.0.0
        </p>
      </div>
    </div>
  );
};