import { useEffect, useState } from 'react';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';

interface TenantCheckerProps {
  children: React.ReactNode;
}

export const TenantChecker = ({ children }: TenantCheckerProps) => {
  const { currentUser } = useAuthStore();
  const { fetchTenant, currentTenant, isLoading } = useTenantStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkTenant = async () => {
      if (!currentUser?.tenantId) {
        setError('No tenant associated with this user account.');
        return;
      }

      try {
        await fetchTenant(currentUser.tenantId);
      } catch (err) {
        console.error('Error loading tenant:', err);
        setError('Unable to load tenant information. Please contact support.');
      }
    };

    if (currentUser && !currentTenant) {
      checkTenant();
    }
  }, [currentUser, currentTenant, fetchTenant]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Tenant Not Found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            
            {/* Demo Mode Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Demo Mode Available
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                To use the demo tenant, register with:
              </p>
              <div className="text-left bg-white dark:bg-gray-800 rounded p-3 text-xs font-mono">
                <div>Tenant Code: <span className="font-bold text-blue-600 dark:text-blue-400">DEMO</span></div>
              </div>
            </div>
            
            <button
              onClick={() => {
                window.location.href = '/logout';
              }}
              className="btn btn-primary w-full"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTenant && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};