import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Key, Smartphone, History, Lock, AlertTriangle, Fingerprint } from 'lucide-react';

interface SecurityOption {
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  badge?: string;
}

const SecuritySettingsPage: React.FC = () => {
  const location = useLocation();
  const isSubRoute = location.pathname !== '/settings/security';

  const securityOptions: SecurityOption[] = [
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      link: '/settings/security/2fa',
      icon: <Smartphone className="w-5 h-5" />,
    },
    {
      title: 'Biometric Authentication',
      description: 'Use fingerprint or face recognition to sign in',
      link: '/settings/biometric',
      icon: <Fingerprint className="w-5 h-5" />,
    },
    {
      title: 'Password & Security',
      description: 'Change your password and security questions',
      link: '/settings/security/password',
      icon: <Key className="w-5 h-5" />,
    },
    {
      title: 'Login Sessions',
      description: 'View and manage active login sessions',
      link: '/settings/security/sessions',
      icon: <History className="w-5 h-5" />,
    },
    {
      title: 'Security Keys',
      description: 'Manage hardware security keys and passkeys',
      link: '/settings/security/keys',
      icon: <Lock className="w-5 h-5" />,
      badge: 'Beta',
    },
    {
      title: 'Security Alerts',
      description: 'Configure alerts for suspicious activity',
      link: '/settings/security/alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  if (isSubRoute) {
    return <Outlet />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security & Privacy
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account security settings and privacy preferences
        </p>
      </div>

      <div className="space-y-4">
        {securityOptions.map((option) => (
          <Link
            key={option.link}
            to={option.link}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {option.title}
                  </h3>
                  {option.badge && (
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">
              Security Recommendations
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Enable two-factor authentication and use a strong, unique password to keep your account secure.
              Regular security checkups help protect your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;