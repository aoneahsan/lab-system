import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useImpersonationStore } from '@/stores/impersonation.store';
import onboardingService from '@/services/OnboardingService';
import { uiLogger } from '@/services/logger.service';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const location = useLocation();
  const { isImpersonating, impersonatedUser } = useImpersonationStore();
  
  const [onboardingStatus, setOnboardingStatus] = useState<{
    isComplete: boolean;
    nextStep: number;
    isLoading: boolean;
  }>({
    isComplete: false,
    nextStep: 0,
    isLoading: true,
  });

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!currentUser || currentUser.role === 'super_admin') {
        setOnboardingStatus({ isComplete: true, nextStep: -1, isLoading: false });
        return;
      }

      try {
        const isComplete = await onboardingService.isOnboardingComplete(currentUser.id);
        const nextStep = await onboardingService.getNextIncompleteStep(currentUser.id);
        
        setOnboardingStatus({
          isComplete,
          nextStep,
          isLoading: false,
        });
      } catch (error) {
        uiLogger.error('Error checking onboarding status:', error);
        setOnboardingStatus({ isComplete: false, nextStep: 0, isLoading: false });
      }
    };

    if (isAuthenticated && currentUser) {
      checkOnboarding();
    } else {
      setOnboardingStatus({ isComplete: false, nextStep: 0, isLoading: false });
    }
  }, [currentUser, isAuthenticated]);

  // Not authenticated
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
      '/clinician',
      '/equipment',
      '/emr',
      '/analytics'
    ];

    const isEndUserRoute = endUserRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isEndUserRoute) {
      return <Navigate to="/admin" replace />;
    }

    // Super admins don't need onboarding or tenant
    return <Outlet />;
  }

  // Loading states
  if (tenantLoading || onboardingStatus.isLoading) {
    return <LoadingScreen />;
  }

  // Handle onboarding routes
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

  // If onboarding is complete and user tries to access onboarding pages
  if (isOnboardingRoute && onboardingStatus.isComplete && tenant) {
    return <Navigate to="/dashboard" replace />;
  }

  // If onboarding is not complete and user tries to access other pages
  if (!isOnboardingRoute && !onboardingStatus.isComplete && currentUser?.role !== 'super_admin') {
    // Redirect to the appropriate onboarding step
    if (onboardingStatus.nextStep >= 0) {
      return <Navigate to={`/onboarding/setup-laboratory?step=${onboardingStatus.nextStep}`} replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Allow onboarding pages to be accessed without a tenant (during setup)
  if (isOnboardingRoute && !onboardingStatus.isComplete) {
    return <Outlet />;
  }

  // Check for tenant after onboarding is complete
  if (!tenant && onboardingStatus.isComplete) {
    // This shouldn't happen, but if it does, redirect to onboarding
    return <Navigate to="/onboarding" replace />;
  }

  // Check if tenant is active
  if (tenant && !tenant.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Account Suspended
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your laboratory account has been suspended. Please contact support for assistance.
            </p>
            <div className="space-y-3">
              <a 
                href="mailto:support@labflow.com" 
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
              <button 
                onClick={() => useAuthStore.getState().logout()} 
                className="btn btn-secondary w-full"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};