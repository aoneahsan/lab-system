import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { LabStaffLayout } from '@/mobile/layouts/LabStaffLayout';
import { Suspense, lazy } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Lazy load lab staff pages
const LabStaffLoginPage = lazy(() => import('@/mobile/pages/labstaff/LabStaffLoginPage'));
const LabStaffHomePage = lazy(() => import('@/mobile/pages/labstaff/LabStaffHomePage'));
const LabStaffResultsPage = lazy(() => import('@/mobile/pages/labstaff/LabStaffResultsPage'));
const LabStaffQCPage = lazy(() => import('@/mobile/pages/labstaff/LabStaffQCPage'));
const LabStaffEquipmentPage = lazy(() => import('@/mobile/pages/labstaff/LabStaffEquipmentPage'));
const LabStaffSamplePage = lazy(() => import('@/mobile/pages/labstaff/LabStaffSamplePage'));

export const LabStaffApp: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/home" /> : <LabStaffLoginPage />
          }
        />

        {/* Protected routes */}
        {isAuthenticated ? (
          <Route element={<LabStaffLayout />}>
            <Route path="/home" element={<LabStaffHomePage />} />
            <Route path="/results" element={<LabStaffResultsPage />} />
            <Route path="/qc" element={<LabStaffQCPage />} />
            <Route path="/equipment" element={<LabStaffEquipmentPage />} />
            <Route path="/sample/:id" element={<LabStaffSamplePage />} />
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