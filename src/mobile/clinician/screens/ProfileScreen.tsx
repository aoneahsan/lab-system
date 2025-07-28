import React, { useState } from 'react';
import {
  User,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  FileText,
  BarChart3,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ClinicianStats {
  totalPatients: number;
  ordersThisMonth: number;
  avgResponseTime: number;
  patientSatisfaction: number;
  criticalResultsHandled: number;
  continuingEducationHours: number;
}

interface Credential {
  id: string;
  title: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expiring' | 'expired';
}

export const ProfileScreen: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [stats] = useState<ClinicianStats>({
    totalPatients: 142,
    ordersThisMonth: 286,
    avgResponseTime: 2.5,
    patientSatisfaction: 94,
    criticalResultsHandled: 42,
    continuingEducationHours: 18,
  });

  const [credentials] = useState<Credential[]>([
    {
      id: '1',
      title: 'MD - Doctor of Medicine',
      issuer: 'Harvard Medical School',
      issueDate: new Date('2015-05-15'),
      status: 'active',
    },
    {
      id: '2',
      title: 'Board Certification - Internal Medicine',
      issuer: 'American Board of Internal Medicine',
      issueDate: new Date('2018-07-20'),
      expiryDate: new Date('2028-07-20'),
      status: 'active',
    },
    {
      id: '3',
      title: 'State Medical License',
      issuer: 'California Medical Board',
      issueDate: new Date('2018-01-10'),
      expiryDate: new Date('2025-01-10'),
      status: 'expiring',
    },
  ]);

  const menuItems = [
    { icon: Bell, label: 'Notification Settings', action: '/clinician/notifications-settings' },
    { icon: Shield, label: 'Privacy & Security', action: '/clinician/privacy' },
    { icon: FileText, label: 'Medical Licenses', badge: '1', action: '/clinician/licenses' },
    { icon: Award, label: 'Certifications & CME', action: '/clinician/certifications' },
    { icon: BarChart3, label: 'Performance Metrics', action: '/clinician/metrics' },
    { icon: Calendar, label: 'Schedule Preferences', action: '/clinician/schedule-preferences' },
    { icon: Settings, label: 'App Settings', action: '/clinician/settings' },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const getCredentialColor = (status: string) => {
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
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  Dr. {currentUser?.displayName || 'John Smith'}
                </h2>
                <p className="text-indigo-100">{currentUser?.email}</p>
                <p className="text-sm text-indigo-200 mt-1">Employee ID: DOC-4521</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-yellow-300">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 text-sm">4.8</span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">Patient Rating</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
              <p className="text-xs text-indigo-100">Patients</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
              <p className="text-xs text-indigo-100">Orders/Mo</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.avgResponseTime}h</p>
              <p className="text-xs text-indigo-100">Avg Response</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-600">(555) 123-4567</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-600">{currentUser?.email || 'doctor@labflow.com'}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-600">Medical Center, Building A, Floor 3</span>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Performance Summary</h3>
            <button className="text-sm text-indigo-600 font-medium">View details</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-semibold">{stats.patientSatisfaction}%</p>
              <p className="text-xs text-gray-600">Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-lg font-semibold">{stats.avgResponseTime}h</p>
              <p className="text-xs text-gray-600">Response Time</p>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Credentials</h3>
            {credentials.some((c) => c.status === 'expiring') && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                1 expiring soon
              </span>
            )}
          </div>
          <div className="space-y-2">
            {credentials.map((credential) => (
              <div key={credential.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{credential.title}</p>
                  <p className="text-xs text-gray-500">{credential.issuer}</p>
                  {credential.expiryDate && (
                    <p className="text-xs text-gray-500">
                      Expires {format(credential.expiryDate, 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getCredentialColor(
                    credential.status
                  )}`}
                >
                  {credential.status === 'expiring' ? 'Renew Soon' : credential.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Continuing Education */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">CME Hours</h3>
              <p className="text-sm text-gray-600 mt-1">This year's progress</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stats.continuingEducationHours}</p>
              <p className="text-sm text-gray-600">of 20 required</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(stats.continuingEducationHours / 20) * 100}%` }}
              />
            </div>
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
