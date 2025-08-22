import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { biometricAuth } from '@/services/biometric-auth.service';
import { modalService } from '@/services/modal.service';
import { toast } from 'react-hot-toast';
import { logger } from '@/services/logger.service';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const available = await biometricAuth.isAvailable();
      setBiometricAvailable(available);
      
      if (available) {
        const enabled = await biometricAuth.isBiometricEnabled();
        setBiometricEnabled(enabled);
      }
    } catch (error) {
      logger.error('Error checking biometric status:', error);
    }
  };

  const handleLogout = async () => {
    if (await modalService.confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel'
    })) {
      await logout();
      navigate('/login');
    }
  };

  const toggleBiometric = async () => {
    try {
      if (!biometricEnabled) {
        // Enable biometric authentication
        const success = await biometricAuth.enableBiometricAuth(
          currentUser?.email || '',
          'stored-password' // In real app, would need secure password handling
        );
        
        if (success) {
          setBiometricEnabled(true);
          toast.success('Biometric authentication enabled');
        } else {
          toast.error('Failed to enable biometric authentication');
        }
      } else {
        // Disable biometric authentication
        await biometricAuth.disableBiometricAuth();
        setBiometricEnabled(false);
        toast.success('Biometric authentication disabled');
      }
    } catch (error) {
      toast.error('Failed to update biometric settings');
      logger.error('Biometric toggle error:', error);
    }
  };

  const menuItems = [
    {
      title: 'Personal Information',
      icon: User,
      action: () => navigate('/patient/profile/personal'),
    },
    {
      title: 'Notification Settings',
      icon: Bell,
      action: () => navigate('/patient/profile/notifications'),
    },
    {
      title: 'Security',
      icon: Shield,
      action: () => navigate('/patient/profile/security'),
    },
    {
      title: 'Payment Methods',
      icon: CreditCard,
      action: () => navigate('/patient/profile/payment'),
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      action: () => navigate('/patient/help'),
    },
  ];

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium text-gray-900">{currentUser?.displayName}</h2>
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Patient ID: {currentUser?.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Biometric Toggle */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Fingerprint className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Biometric Login</p>
                  <p className="text-xs text-gray-500">Use fingerprint or face ID</p>
                </div>
              </div>
              <button
                onClick={toggleBiometric}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  biometricEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="mt-4 bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{item.title}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* App Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">LabFlow Patient App</p>
          <p className="text-xs text-gray-400">Version 1.0.0</p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};