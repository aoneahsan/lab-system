import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface SettingCategory {
  title: string;
  description: string;
  link: string;
  icon: string;
  roles?: string[];
}

const settingCategories: SettingCategory[] = [
  {
    title: 'General Settings',
    description: 'Configure general system preferences and display options',
    link: '/settings/general',
    icon: '⚙️',
  },
  {
    title: 'Biometric Authentication',
    description: 'Manage fingerprint and face authentication settings',
    link: '/settings/biometric',
    icon: '🔐',
  },
  {
    title: 'Notifications',
    description: 'Configure email, SMS, and push notification preferences',
    link: '/settings/notifications',
    icon: '🔔',
  },
  {
    title: 'Security & Privacy',
    description: 'Manage security settings, two-factor authentication, and privacy options',
    link: '/settings/security',
    icon: '🛡️',
  },
  {
    title: 'Laboratory Configuration',
    description: 'Configure test panels, reference ranges, and lab-specific settings',
    link: '/settings/laboratory',
    icon: '🧪',
    roles: ['admin', 'lab_manager'],
  },
  {
    title: 'Custom Fields',
    description: 'Manage custom fields for patients, tests, samples, and other modules',
    link: '/settings/custom-fields',
    icon: '📋',
    roles: ['admin'],
  },
  {
    title: 'Validation Rules',
    description: 'Configure result validation rules and quality control checks',
    link: '/settings/validation-rules',
    icon: '✅',
    roles: ['admin', 'lab_manager', 'lab_technician'],
  },
  {
    title: 'Billing & Insurance',
    description: 'Set up billing codes, insurance providers, and payment settings',
    link: '/settings/billing',
    icon: '💳',
    roles: ['admin', 'billing_staff'],
  },
  {
    title: 'Integration Settings',
    description: 'Configure EMR integrations, HL7/FHIR settings, and API access',
    link: '/settings/integrations',
    icon: '🔗',
    roles: ['admin'],
  },
  {
    title: 'System Administration',
    description: 'Manage users, roles, permissions, and system-wide settings',
    link: '/settings/admin',
    icon: '👥',
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'App Updates',
    description: 'Check for updates, manage app versions, and update settings',
    link: '/settings/updates',
    icon: '🔄',
  },
];

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore();

  // Filter categories based on user role
  const availableCategories = settingCategories.filter((category) => {
    if (!category.roles) return true;
    return category.roles.includes(currentUser?.role || '');
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure system settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableCategories.map((category) => (
          <Link
            key={category.link}
            to={category.link}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{category.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
