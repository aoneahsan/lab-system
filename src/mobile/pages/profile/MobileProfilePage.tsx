import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Bell, 
  CreditCard,
  LogOut,
  ChevronRight,
  Camera,
  Heart,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  profilePicture?: string;
  memberSince: Date;
}

const MobileProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mock user data - in production would come from API
  const [userProfile] = useState<UserProfile>({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    dateOfBirth: new Date(1985, 5, 15),
    gender: 'male',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '(555) 987-6543',
      relationship: 'Spouse'
    },
    insuranceInfo: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BC123456789',
      groupNumber: 'GRP98765'
    },
    memberSince: new Date(2020, 0, 15)
  });

  const menuItems = [
    {
      id: 'personal',
      label: 'Personal Information',
      icon: User,
      onClick: () => navigate('/mobile/profile/edit')
    },
    {
      id: 'insurance',
      label: 'Insurance Information',
      icon: CreditCard,
      onClick: () => navigate('/mobile/insurance')
    },
    {
      id: 'emergency',
      label: 'Emergency Contacts',
      icon: Heart,
      onClick: () => navigate('/mobile/emergency-contacts')
    },
    {
      id: 'medical',
      label: 'Medical History',
      icon: FileText,
      onClick: () => navigate('/mobile/medical-history')
    },
    {
      id: 'notifications',
      label: 'Notification Settings',
      icon: Bell,
      onClick: () => navigate('/mobile/notifications')
    },
    {
      id: 'security',
      label: 'Security & Privacy',
      icon: Shield,
      onClick: () => navigate('/mobile/security')
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="px-4 pt-12 pb-8">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>
          
          {/* Profile Info */}
          <div className="flex items-center">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                {userProfile.profilePicture ? (
                  <img
                    src={userProfile.profilePicture}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold">{getInitials()}</span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Camera className="h-4 w-4 text-gray-700" />
              </button>
            </div>
            
            <div className="ml-4 flex-1">
              <h2 className="text-xl font-semibold">
                {userProfile.firstName} {userProfile.lastName}
              </h2>
              <p className="text-white/80 text-sm">{userProfile.email}</p>
              <p className="text-white/70 text-xs mt-1">
                Member since {format(userProfile.memberSince, 'MMMM yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </div>
              <p className="font-medium text-gray-900">{userProfile.phone}</p>
            </div>
            <div>
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                Date of Birth
              </div>
              <p className="font-medium text-gray-900">
                {format(userProfile.dateOfBirth, 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <MapPin className="h-4 w-4 mr-2" />
                Address
              </div>
              <p className="font-medium text-gray-900">
                {userProfile.address.street}, {userProfile.address.city}, {userProfile.address.state} {userProfile.address.zipCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {menuItems.map((item, _index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full mt-6 px-4 py-4 bg-white rounded-lg shadow-sm flex items-center justify-center text-red-600 font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </button>

        {/* App Version */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>LabFlow Mobile v1.0.0</p>
          <p className="mt-1">© 2024 LabFlow. All rights reserved.</p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20" />
    </div>
  );
};

export default MobileProfilePage;