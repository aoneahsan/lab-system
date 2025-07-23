import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@stores/auth.store';
import { useTenant } from '@hooks/useTenant';
import { LoadingScreen } from '@components/ui/LoadingScreen';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const { tenant, isLoading } = useTenant();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tenant Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unable to load tenant information. Please contact support.
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="btn btn-primary"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
  
  if (!tenant.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Account Suspended
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your laboratory account has been suspended. Please contact support.
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="btn btn-primary"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
  
  return <Outlet />;
};