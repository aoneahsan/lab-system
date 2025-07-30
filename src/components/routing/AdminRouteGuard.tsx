import { Navigate } from 'react-router-dom';
import { useImpersonationStore } from '@/stores/impersonation.store';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const { isImpersonating } = useImpersonationStore();

  // Block access to admin routes during impersonation
  if (isImpersonating) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};