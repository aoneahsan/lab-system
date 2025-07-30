import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const DefaultRedirect = () => {
  const { isAuthenticated, currentUser } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect super admin to admin panel
  if (currentUser?.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Redirect all other authenticated users to dashboard
  return <Navigate to="/dashboard" replace />;
};