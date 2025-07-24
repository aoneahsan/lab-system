import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { MobileLayout } from '@/mobile/layouts/MobileLayout';
import { Suspense, lazy } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Lazy load mobile pages
const MobileLoginPage = lazy(() => import('@/mobile/pages/auth/MobileLoginPage'));
const MobileHomePage = lazy(() => import('@/mobile/pages/MobileHomePage'));
const MobileAppointmentsPage = lazy(() => import('@/mobile/pages/appointments/MobileAppointmentsPage'));
const MobileResultsPage = lazy(() => import('@/mobile/pages/results/MobileResultsPage'));
const MobileReportsPage = lazy(() => import('@/mobile/pages/reports/MobileReportsPage'));
const MobilePaymentsPage = lazy(() => import('@/mobile/pages/payments/MobilePaymentsPage'));
const MobileFamilyPage = lazy(() => import('@/mobile/pages/family/MobileFamilyPage'));
const MobileProfilePage = lazy(() => import('@/mobile/pages/profile/MobileProfilePage'));
const MobileLocationsPage = lazy(() => import('@/mobile/pages/locations/MobileLocationsPage'));

export const PatientApp: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/home" /> : <MobileLoginPage />
          }
        />

        {/* Protected routes */}
        {isAuthenticated ? (
          <Route element={<MobileLayout />}>
            <Route path="/home" element={<MobileHomePage />} />
            <Route path="/appointments" element={<MobileAppointmentsPage />} />
            <Route path="/results" element={<MobileResultsPage />} />
            <Route path="/reports" element={<MobileReportsPage />} />
            <Route path="/payments" element={<MobilePaymentsPage />} />
            <Route path="/family" element={<MobileFamilyPage />} />
            <Route path="/profile" element={<MobileProfilePage />} />
            <Route path="/locations" element={<MobileLocationsPage />} />
          </Route>
        ) : null}

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/home' : '/login'} />}
        />
      </Routes>
    </Suspense>
  );
};