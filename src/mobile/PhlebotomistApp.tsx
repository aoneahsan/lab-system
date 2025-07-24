import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { PhlebotomistLayout } from '@/mobile/layouts/PhlebotomistLayout';
import { Suspense, lazy } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Lazy load phlebotomist pages
const PhlebotomistLoginPage = lazy(() => import('@/mobile/pages/phlebotomist/PhlebotomistLoginPage'));
const PhlebotomistHomePage = lazy(() => import('@/mobile/pages/phlebotomist/PhlebotomistHomePage'));
const PhlebotomistRoutePage = lazy(() => import('@/mobile/pages/phlebotomist/PhlebotomistRoutePage'));
const PhlebotomistCollectionPage = lazy(() => import('@/mobile/pages/phlebotomist/PhlebotomistCollectionPage'));
const PhlebotomistScanPage = lazy(() => import('@/mobile/pages/phlebotomist/PhlebotomistScanPage'));
const PhlebotomistSyncPage = lazy(() => import('@/mobile/pages/phlebotomist/PhlebotomistSyncPage'));

export const PhlebotomistApp: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/home" /> : <PhlebotomistLoginPage />
          }
        />

        {/* Protected routes */}
        {isAuthenticated ? (
          <Route element={<PhlebotomistLayout />}>
            <Route path="/home" element={<PhlebotomistHomePage />} />
            <Route path="/route" element={<PhlebotomistRoutePage />} />
            <Route path="/collection" element={<PhlebotomistCollectionPage />} />
            <Route path="/scan" element={<PhlebotomistScanPage />} />
            <Route path="/sync" element={<PhlebotomistSyncPage />} />
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