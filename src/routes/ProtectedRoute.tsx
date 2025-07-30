import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const { tenant, isLoading } = useTenant();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Super admins don't need a tenant - they have system-wide access
  if (currentUser?.role === 'super_admin') {
    return <Outlet />;
  }

  // Allow onboarding page to be accessed without a tenant
  if (location.pathname === '/onboarding') {
    return <Outlet />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!tenant) {
    // If user has no tenant and they're not already on the onboarding page, redirect them
    return <Navigate to="/onboarding" replace />;
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
          <button onClick={() => useAuthStore.getState().logout()} className="btn btn-primary">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
