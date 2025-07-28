import React, { useState } from 'react';
import {
  User,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  FileText,
  Activity,
  Calendar,
  Star,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface PerformanceStats {
  samplesProcessed: number;
  avgTAT: number;
  qcPassRate: number;
  criticalResultsHandled: number;
  efficiency: number;
  monthlyTarget: number;
  monthlyCompleted: number;
  rank: number;
  totalStaff: number;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  expiryDate: Date;
  status: 'active' | 'expiring' | 'expired';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedDate: Date;
  icon: string;
}

export const ProfileScreen: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [stats] = useState<PerformanceStats>({
    samplesProcessed: 2847,
    avgTAT: 38,
    qcPassRate: 99.2,
    criticalResultsHandled: 156,
    efficiency: 95,
    monthlyTarget: 600,
    monthlyCompleted: 487,
    rank: 3,
    totalStaff: 12,
  });

  const [certifications] = useState<Certification[]>([
    {
      id: '1',
      name: 'Clinical Laboratory Technician',
      issuer: 'ASCP Board of Certification',
      expiryDate: new Date('2025-12-31'),
      status: 'active',
    },
    {
      id: '2',
      name: 'Lab Safety Certification',
      issuer: 'Healthcare Safety Council',
      expiryDate: new Date('2024-11-15'),
      status: 'expiring',
    },
    {
      id: '3',
      name: 'Quality Management Systems',
      issuer: 'ISO Training Institute',
      expiryDate: new Date('2025-06-30'),
      status: 'active',
    },
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Speed Demon',
      description: 'Maintained <40min TAT for a month',
      earnedDate: new Date('2024-09-15'),
      icon: '⚡',
    },
    {
      id: '2',
      title: 'Quality Champion',
      description: '100% QC pass rate for 30 days',
      earnedDate: new Date('2024-08-20'),
      icon: '🏆',
    },
    {
      id: '3',
      title: 'Critical Care Hero',
      description: 'Handled 50+ critical results',
      earnedDate: new Date('2024-07-10'),
      icon: '🦸',
    },
  ]);

  const menuItems = [
    { icon: Award, label: 'Certifications & Training', badge: '1', action: '/certifications' },
    { icon: Activity, label: 'Performance Dashboard', action: '/performance' },
    { icon: Calendar, label: 'Schedule & Shifts', action: '/schedule' },
    { icon: Bell, label: 'Notifications', action: '/notifications' },
    { icon: Settings, label: 'Settings', action: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', action: '/help' },
    { icon: FileText, label: 'SOPs & Guidelines', action: '/protocols' },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const getCertificationColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'expiring':
        return 'text-yellow-600 bg-yellow-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {currentUser?.displayName || 'Lab Technician'}
                </h2>
                <p className="text-blue-100">{currentUser?.email}</p>
                <p className="text-sm text-blue-200 mt-1">Employee ID: LT001</p>
              </div>
            </div>
            <Shield className="h-5 w-5 text-blue-200" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.samplesProcessed}</p>
              <p className="text-xs text-blue-100">Total Processed</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.avgTAT}m</p>
              <p className="text-xs text-blue-100">Avg TAT</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">#{stats.rank}</p>
              <p className="text-xs text-blue-100">Dept Rank</p>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Monthly Target</h3>
            <span className="text-sm text-gray-500">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Samples Processed</span>
              <span className="font-medium">
                {stats.monthlyCompleted} / {stats.monthlyTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(stats.monthlyCompleted / stats.monthlyTarget) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {Math.round((stats.monthlyCompleted / stats.monthlyTarget) * 100)}% completed
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-semibold">{stats.qcPassRate}%</p>
              <p className="text-xs text-gray-600">QC Pass Rate</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-lg font-semibold">{stats.efficiency}%</p>
              <p className="text-xs text-gray-600">Efficiency</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent Achievements</h3>
            <button className="text-sm text-indigo-600 font-medium">View all</button>
          </div>
          <div className="space-y-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 py-2">
                <div className="h-10 w-10 bg-yellow-50 rounded-lg flex items-center justify-center text-xl">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Certifications</h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              1 expiring soon
            </span>
          </div>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">
                    Expires {format(cert.expiryDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getCertificationColor(
                    cert.status
                  )}`}
                >
                  {cert.status === 'expiring' ? 'Renew Soon' : cert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(item.action)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
