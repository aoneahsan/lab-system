import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  FileText,
  Heart,
  CreditCard,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Edit,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

interface ProfileSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{
    label: string;
    value?: string;
    action?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mock user data - replace with actual user data
  const userData = {
    name: currentUser?.displayName || 'John Doe',
    email: currentUser?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: new Date('1985-06-15'),
    gender: 'Male',
    bloodGroup: 'O+',
    patientId: 'P12345678',
    memberSince: new Date('2023-01-15'),
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1 (555) 987-6543',
    },
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
  };

  const profileSections: ProfileSection[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: User,
      items: [
        { label: 'Full Name', value: userData.name },
        { label: 'Email', value: userData.email },
        { label: 'Phone', value: userData.phone },
        { label: 'Date of Birth', value: format(userData.dateOfBirth, 'MMM dd, yyyy') },
        { label: 'Gender', value: userData.gender },
        { label: 'Blood Group', value: userData.bloodGroup },
        { label: 'Patient ID', value: userData.patientId },
      ],
    },
    {
      id: 'medical',
      title: 'Medical Information',
      icon: Heart,
      items: [
        {
          label: 'Medical History',
          action: () => navigate('/patient/medical-history'),
          icon: ChevronRight,
        },
        {
          label: 'Allergies & Medications',
          action: () => navigate('/patient/allergies'),
          icon: ChevronRight,
        },
        {
          label: 'Emergency Contacts',
          action: () => navigate('/patient/emergency-contacts'),
          icon: ChevronRight,
        },
      ],
    },
    {
      id: 'insurance',
      title: 'Insurance & Billing',
      icon: Shield,
      items: [
        {
          label: 'Insurance Cards',
          action: () => navigate('/patient/insurance'),
          icon: ChevronRight,
        },
        {
          label: 'Payment Methods',
          action: () => navigate('/patient/payment-methods'),
          icon: ChevronRight,
        },
        {
          label: 'Billing History',
          action: () => navigate('/patient/billing-history'),
          icon: ChevronRight,
        },
      ],
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: FileText,
      items: [
        {
          label: 'Test Reports',
          action: () => navigate('/patient/results'),
          icon: ChevronRight,
        },
        {
          label: 'Prescriptions',
          action: () => navigate('/patient/prescriptions'),
          icon: ChevronRight,
        },
        {
          label: 'Download All Records',
          action: () => console.log('Download records'),
          icon: Download,
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Bell,
      items: [
        {
          label: 'Notification Preferences',
          action: () => navigate('/patient/notifications-settings'),
          icon: ChevronRight,
        },
        {
          label: 'Privacy Settings',
          action: () => navigate('/patient/privacy'),
          icon: ChevronRight,
        },
        {
          label: 'Change Password',
          action: () => navigate('/patient/change-password'),
          icon: ChevronRight,
        },
        {
          label: 'Biometric Login',
          action: () => navigate('/patient/biometric-settings'),
          icon: ChevronRight,
        },
      ],
    },
    {
      id: 'support',
      title: 'Help & Support',
      icon: HelpCircle,
      items: [
        {
          label: 'FAQs',
          action: () => navigate('/patient/faqs'),
          icon: ChevronRight,
        },
        {
          label: 'Contact Support',
          action: () => navigate('/patient/support'),
          icon: ChevronRight,
        },
        {
          label: 'Terms & Conditions',
          action: () => navigate('/patient/terms'),
          icon: ChevronRight,
        },
        {
          label: 'Privacy Policy',
          action: () => navigate('/patient/privacy-policy'),
          icon: ChevronRight,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/patient/login');
  };

  return (
    <div className="flex-1 bg-gray-50 pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">My Profile</h1>
          <button
            onClick={() => navigate('/patient/edit-profile')}
            className="p-2 bg-white/20 rounded-lg"
          >
            <Edit className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-20 w-20 bg-white/30 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md">
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold">{userData.name}</h2>
            <p className="text-indigo-100">{userData.email}</p>
            <p className="text-sm text-indigo-200 mt-1">
              Member since {format(userData.memberSince, 'MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-indigo-100">Tests Done</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-indigo-100">Upcoming</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">85</p>
            <p className="text-xs text-indigo-100">Health Score</p>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="p-4 space-y-4">
        {profileSections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <section.icon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  onClick={item.action}
                  className={`px-4 py-3 ${item.action ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{item.label}</p>
                      {item.value && <p className="text-gray-900 font-medium">{item.value}</p>}
                    </div>
                    {item.icon && <item.icon className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>

        {/* App Version */}
        <p className="text-center text-sm text-gray-500 mt-4">LabFlow Patient App v1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
