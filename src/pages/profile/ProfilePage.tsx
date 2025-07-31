import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/date-utils';
import { toast } from '@/stores/toast.store';

const ProfilePage = () => {
  const { currentUser, updateProfile } = useAuthStore();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    professionalId: currentUser?.professionalId || '',
    specialization: currentUser?.specialization || '',
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      toast.success('Profile Updated', 'Your profile has been updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Update Failed', 'Failed to update profile. Please try again.');
    }
  };

  const securityFeatures = [
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: currentUser?.twoFactorEnabled ? 'Enabled' : 'Disabled',
      action: () => navigate('/settings/security/2fa'),
      icon: '🔐',
    },
    {
      title: 'Biometric Authentication',
      description: 'Use fingerprint or face recognition to sign in',
      status: currentUser?.biometricEnabled ? 'Enabled' : 'Disabled',
      action: () => navigate('/settings/biometric'),
      icon: '👆',
    },
    {
      title: 'Change Password',
      description: 'Update your account password',
      action: () => navigate('/settings/security/password'),
      icon: '🔑',
    },
  ];

  const preferences = [
    {
      title: 'Email Notifications',
      description: 'Receive email updates about important activities',
      value: currentUser?.preferences?.emailNotifications ?? true,
      key: 'emailNotifications',
    },
    {
      title: 'SMS Notifications',
      description: 'Get SMS alerts for critical results and urgent matters',
      value: currentUser?.preferences?.smsNotifications ?? false,
      key: 'smsNotifications',
    },
    {
      title: 'Dark Mode',
      description: 'Use dark theme for the application',
      value: currentUser?.preferences?.darkMode ?? false,
      key: 'darkMode',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Personal Information */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h2>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="btn btn-primary btn-sm"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{currentUser?.firstName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{currentUser?.lastName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{currentUser?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {currentUser?.phoneNumber || 'Not provided'}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <p className="text-gray-900 dark:text-white capitalize">
                {currentUser?.role?.replace('_', ' ')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Laboratory
              </label>
              <p className="text-gray-900 dark:text-white">{tenant?.name}</p>
            </div>
            
            {(currentUser?.role === 'pathologist' || currentUser?.role === 'radiologist' || 
              currentUser?.role === 'clinician') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Professional ID
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.professionalId}
                      onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {currentUser?.professionalId || 'Not provided'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specialization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {currentUser?.specialization || 'Not provided'}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Member Since: </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(currentUser?.createdAt || new Date())}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Last Login: </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(currentUser?.lastLoginAt || new Date())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Security Settings
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                  {feature.status && (
                    <span className={`text-xs font-medium ${
                      feature.status === 'Enabled' 
                        ? 'text-success-600 dark:text-success-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {feature.status}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={feature.action}
                className="btn btn-outline btn-sm"
              >
                {feature.status === 'Enabled' ? 'Manage' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notification Preferences
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {preferences.map((pref) => (
            <div
              key={pref.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {pref.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pref.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref.value}
                  onChange={async (e) => {
                    const newPreferences = {
                      ...currentUser?.preferences,
                      [pref.key]: e.target.checked,
                    };
                    try {
                      await updateProfile({ preferences: newPreferences });
                      toast.success('Preference Updated', `${pref.title} has been ${e.target.checked ? 'enabled' : 'disabled'}`);
                    } catch (error) {
                      toast.error('Update Failed', 'Failed to update preference');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger-200 dark:border-danger-800">
        <div className="p-6 border-b border-danger-200 dark:border-danger-800">
          <h2 className="text-xl font-semibold text-danger-600 dark:text-danger-400">
            Danger Zone
          </h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  toast.info('Account Deletion', 'Please contact your administrator to delete your account.');
                }
              }}
              className="btn btn-danger btn-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;