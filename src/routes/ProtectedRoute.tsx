import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useImpersonationStore } from '@/stores/impersonation.store';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const { tenant, isLoading } = useTenant();
  const location = useLocation();
  const { isImpersonating, impersonatedUser } = useImpersonationStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // During impersonation, use the impersonated user for role checks
  const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;

  // Check role-based access
  if (allowedRoles && effectiveUser && !allowedRoles.includes(effectiveUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Super admins who are NOT impersonating should be redirected to admin panel
  // when trying to access end-user routes
  if (currentUser?.role === 'super_admin' && !isImpersonating) {
    const endUserRoutes = [
      '/dashboard',
      '/patients',
      '/tests',
      '/samples',
      '/results',
      '/billing',
      '/inventory',
      '/quality-control',
      '/reports',
      '/onboarding',
      '/clinician',
      '/equipment',
      '/emr',
      '/analytics'
    ];

    // Profile and Settings pages should be accessible to all users including super admins
    const isEndUserRoute = endUserRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isEndUserRoute) {
      return <Navigate to="/admin" replace />;
    }

    // Super admins don't need a tenant when accessing admin routes
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
