import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { useImpersonationStore } from '@/stores/impersonation.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useModalState } from '@/hooks/useModalState';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { toast } from '@/stores/toast.store';
import { Info } from 'lucide-react';
import { QuickActionButton } from '@/components/navigation/QuickActionButton';
import { FeatureInfoModal } from '@/components/navigation/FeatureInfoModal';
import { useHotkeyAction } from '@/hooks/useHotkeys';

// Define separate navigation for super admins
const superAdminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: '🛡️' },
  { name: 'Profile', href: '/profile', icon: '👤' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

// Define navigation for regular users with permission requirements
const regularNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', permissions: 'all' },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: '📅',
    permissions: [PERMISSIONS.HOME_COLLECTION_VIEW_ALL, PERMISSIONS.HOME_COLLECTION_VIEW_ASSIGNED],
  },
  {
    name: 'Home Collection',
    href: '/home-collection',
    icon: '🏠',
    permissions: [PERMISSIONS.HOME_COLLECTION_VIEW_ALL, PERMISSIONS.HOME_COLLECTION_VIEW_ASSIGNED],
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: '👥',
    permissions: [PERMISSIONS.PATIENTS_VIEW_ALL, PERMISSIONS.PATIENTS_VIEW_OWN, PERMISSIONS.PATIENTS_VIEW_ASSIGNED],
  },
  {
    name: 'Tests',
    href: '/tests',
    icon: '🧪',
    permissions: [PERMISSIONS.TESTS_VIEW_ALL, PERMISSIONS.TESTS_VIEW_ASSIGNED],
  },
  {
    name: 'Samples',
    href: '/samples',
    icon: '🩸',
    permissions: [PERMISSIONS.SAMPLES_VIEW_ALL, PERMISSIONS.SAMPLES_COLLECT, PERMISSIONS.SAMPLES_RECEIVE],
  },
  {
    name: 'Results',
    href: '/results',
    icon: '📋',
    permissions: [PERMISSIONS.RESULTS_VIEW_ALL, PERMISSIONS.RESULTS_VIEW_ASSIGNED],
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: '💳',
    permissions: [PERMISSIONS.BILLING_VIEW_ALL, PERMISSIONS.BILLING_VIEW_OWN],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: '📦',
    permissions: [PERMISSIONS.INVENTORY_VIEW_ALL, PERMISSIONS.INVENTORY_VIEW_DEPARTMENT],
  },
  {
    name: 'Quality Control',
    href: '/quality-control',
    icon: '✅',
    permissions: [PERMISSIONS.QC_VIEW_ALL],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: '📈',
    permissions: [PERMISSIONS.REPORTS_VIEW_CLINICAL, PERMISSIONS.REPORTS_VIEW_FINANCIAL, PERMISSIONS.REPORTS_VIEW_OPERATIONAL],
  },
  {
    name: 'Customer Portal',
    href: '/portal',
    icon: '🌐',
    permissions: 'patient', // Special case for patient role
  },
  {
    name: 'Workflow',
    href: '/workflow',
    icon: '⚡',
    permissions: [PERMISSIONS.SETTINGS_MANAGE_WORKFLOWS],
  },
  {
    name: 'Users',
    href: '/users',
    icon: '👥',
    permissions: [PERMISSIONS.USERS_VIEW_ALL],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: '⚙️',
    permissions: [PERMISSIONS.SETTINGS_VIEW_GENERAL, PERMISSIONS.SETTINGS_VIEW_CLINICAL],
  },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const featureModal = useModalState('feature-info');
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { tenant } = useTenant();
  const { isImpersonating, impersonatedUser, endImpersonation } = useImpersonationStore();
  const { hasAnyPermission, userRole } = usePermissions();

  // Register hotkey for help modal
  useHotkeyAction('help', () => featureModal.openModal(), []);

  const handleEndImpersonation = () => {
    endImpersonation();
    toast.success('Impersonation ended', 'Returning to admin panel');
    navigate('/admin');
  };

  // Use impersonated user's role for navigation if impersonating
  const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;

  // Use different navigation for super admins when not impersonating
  const navigation = currentUser?.role === 'super_admin' && !isImpersonating 
    ? superAdminNavigation 
    : regularNavigation;

  // Filter navigation based on permissions
  const filteredNavigation = !currentUser || process.env.NODE_ENV === 'development'
    ? regularNavigation // Show all navigation in dev mode or when not logged in
    : currentUser?.role === 'super_admin' && !isImpersonating
    ? navigation // Super admins see all their navigation items
    : navigation.filter((item) => {
        if ('permissions' in item) {
          if (item.permissions === 'all') return true;
          if (item.permissions === 'patient') return userRole === 'patient';
          if (Array.isArray(item.permissions)) {
            return hasAnyPermission(item.permissions);
          }
        }
        return true;
      });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white p-2">
          <div className="flex items-center justify-between container mx-auto px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Impersonating: {impersonatedUser?.email} ({impersonatedUser?.role})
              </span>
            </div>
            <button
              onClick={handleEndImpersonation}
              className="px-3 py-1 bg-white text-purple-600 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              End Impersonation
            </button>
          </div>
        </div>
      )}

      {/* Header with mobile sidebar toggle and info icon */}
      <div className={`fixed left-0 right-0 z-50 ${isImpersonating ? 'top-10' : 'top-0'} lg:left-64 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
          </button>
          
          {/* Page Title (desktop only) */}
          <div className="hidden lg:block flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {location.pathname === '/dashboard' ? 'Dashboard' :
               location.pathname.startsWith('/patients') ? 'Patients' :
               location.pathname.startsWith('/tests') ? 'Tests' :
               location.pathname.startsWith('/results') ? 'Results' :
               location.pathname.startsWith('/billing') ? 'Billing' :
               location.pathname.startsWith('/inventory') ? 'Inventory' :
               location.pathname.startsWith('/appointments') ? 'Appointments' :
               location.pathname.startsWith('/reports') ? 'Reports' :
               'LabFlow'}
            </h2>
          </div>
          
          {/* Info Icon */}
          <button
            onClick={() => featureModal.openModal()}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="App Features (Shift+?)"
          >
            <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ${isImpersonating ? 'top-10' : 'top-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-primary-600">LabFlow</h1>
            {currentUser?.role === 'super_admin' && !isImpersonating ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">System Administrator</p>
            ) : (
              tenant && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tenant.name}</p>
              )
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-xl">👤</span>
                <div className="flex-1">
                  <p className="font-medium">{effectiveUser?.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{effectiveUser?.role}</p>
                  {isImpersonating && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">Impersonating</p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 ${isImpersonating ? 'pt-24' : 'pt-14'}`}>
        <main className="min-h-screen p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Quick Action Button */}
      <QuickActionButton />

      {/* Feature Info Modal */}
      <FeatureInfoModal isOpen={featureModal.isOpen} onClose={() => featureModal.closeModal()} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
