import React, { useState } from 'react';
import {
  User,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Target,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  Shield,
  Bell,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface PerformanceMetrics {
  totalCollections: number;
  successRate: number;
  avgCollectionTime: number;
  firstAttemptSuccess: number;
  patientSatisfaction: number;
  monthlyTarget: number;
  monthlyCompleted: number;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  expiryDate: Date;
  status: 'active' | 'expiring' | 'expired';
}

export const ProfileScreen: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [metrics] = useState<PerformanceMetrics>({
    totalCollections: 1247,
    successRate: 98.5,
    avgCollectionTime: 4.2,
    firstAttemptSuccess: 96.8,
    patientSatisfaction: 4.8,
    monthlyTarget: 300,
    monthlyCompleted: 268,
  });

  const [certifications] = useState<Certification[]>([
    {
      id: '1',
      name: 'Phlebotomy Certification',
      issuer: 'National Phlebotomy Association',
      expiryDate: new Date('2025-06-15'),
      status: 'active',
    },
    {
      id: '2',
      name: 'CPR/BLS',
      issuer: 'American Heart Association',
      expiryDate: new Date('2024-12-01'),
      status: 'expiring',
    },
    {
      id: '3',
      name: 'Infection Control',
      issuer: 'Healthcare Training Institute',
      expiryDate: new Date('2025-03-20'),
      status: 'active',
    },
  ]);

  const menuItems = [
    { icon: Award, label: 'Certifications & Training', badge: '1', action: '/certifications' },
    { icon: BarChart3, label: 'Performance Reports', action: '/reports' },
    { icon: Bell, label: 'Notifications', action: '/notifications' },
    { icon: Settings, label: 'Settings', action: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', action: '/help' },
    { icon: FileText, label: 'Protocols & Guidelines', action: '/protocols' },
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
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {currentUser?.displayName || 'Phlebotomist'}
                </h2>
                <p className="text-indigo-100">{currentUser?.email}</p>
                <p className="text-sm text-indigo-200 mt-1">Employee ID: PH001</p>
              </div>
            </div>
            <Shield className="h-5 w-5 text-indigo-200" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl font-bold">{metrics.totalCollections}</p>
              <p className="text-sm text-indigo-100">Total Collections</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl font-bold">{metrics.successRate}%</p>
              <p className="text-sm text-indigo-100">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Monthly Progress</h3>
            <span className="text-sm text-gray-500">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Collections</span>
              <span className="font-medium">
                {metrics.monthlyCompleted} / {metrics.monthlyTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${(metrics.monthlyCompleted / metrics.monthlyTarget) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {metrics.monthlyTarget - metrics.monthlyCompleted} collections remaining
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-lg font-semibold">{metrics.avgCollectionTime} min</p>
              <p className="text-xs text-gray-600">Avg. Collection Time</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-semibold">{metrics.firstAttemptSuccess}%</p>
              <p className="text-xs text-gray-600">First Attempt Success</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-lg font-semibold">{metrics.patientSatisfaction}/5</p>
              <p className="text-xs text-gray-600">Patient Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-lg font-semibold">Top 10%</p>
              <p className="text-xs text-gray-600">Department Rank</p>
            </div>
          </div>
        </div>

        {/* Active Certifications */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Certifications</h3>
            <button className="text-sm text-indigo-600 font-medium">View all</button>
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
