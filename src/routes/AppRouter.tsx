import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/auth.store';
import { AuthLayout } from '@layouts/AuthLayout';
import { DashboardLayout } from '@layouts/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

// Lazy load pages for better performance
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@components/ui/LoadingScreen';

const LoginPage = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const PatientsPage = lazy(() => import('@pages/patients/PatientsPage'));
const TestsPage = lazy(() => import('@pages/tests/TestsPage'));
const SamplesPage = lazy(() => import('@pages/samples/SamplesPage'));
const ResultsPage = lazy(() => import('@pages/results/ResultsPage'));
const BillingPage = lazy(() => import('@pages/billing/BillingPage'));
const InventoryPage = lazy(() => import('@pages/inventory/InventoryPage'));
const QualityControlPage = lazy(() => import('@pages/quality-control/QualityControlPage'));
const ReportsPage = lazy(() => import('@pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@pages/profile/ProfilePage'));
const BiometricSettingsPage = lazy(() => import('@pages/settings/BiometricSettingsPage'));

export const AppRouter = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />} />
        </Route>
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/samples" element={<SamplesPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/quality-control" element={<QualityControlPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/biometric" element={<BiometricSettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        
        {/* 404 page */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Page not found</p>
              <a href="/" className="btn btn-primary mt-6">Go to Home</a>
            </div>
          </div>
        } />
      </Routes>
    </Suspense>
  );
};