import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthStore } from '@/stores/auth.store';
import { AppRouter } from '@/routes/AppRouter';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import InitializeDemoTenant from '@/components/setup/InitializeDemoTenant';
import { Capacitor } from '@capacitor/core';
import { MobileAppSelector } from '@/mobile/MobileAppSelector';
import { PerformanceProvider } from '@/providers/PerformanceProvider';
import { performanceMonitor } from '@/utils/performance-monitoring';
import { PerformanceMetrics } from '@/components/performance/PerformanceMetrics';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { TrackingProvider } from '@/providers/TrackingProvider';
import { ErrorHandlingProvider } from '@/providers/ErrorHandlingProvider';
import { initializeNotifications } from '@/services/app-notification.service';
import { firebaseKit } from '@/services/firebase-kit.service';
import { appUpdateService } from '@/services/app-update.service';
import { HotkeyManager } from '@/components/navigation/HotkeyManager';
import { HotkeysProvider } from '@/providers/HotkeysProvider';
import { subscriptionService } from '@/services/subscription.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  const { initializeAuth, isLoading } = useAuthStore();
  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    // Track app initialization
    performanceMonitor.startTrace('app_initialization');
    
    // Initialize auth, notifications, and platform-specific services
    const initialize = async () => {
      try {
        initializeAuth();
        await initializeNotifications();
        
        // Initialize Firebase Kit for analytics, crashlytics, performance
        await firebaseKit.initialize();
        
        // Initialize app update service for native platforms
        await appUpdateService.initialize();
        
        // Initialize subscription plans
        await subscriptionService.initializeDefaultPlans();
      } catch (error) {
        console.error('App initialization error:', error);
        // Continue app loading even if some services fail
      }
    };
    
    initialize();
    
    // Stop trace after a short delay
    setTimeout(() => {
      performanceMonitor.stopTrace('app_initialization');
    }, 100);
  }, [initializeAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Use mobile app for native platforms
  const RouterComponent = isNativePlatform ? MobileAppSelector : AppRouter;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorHandlingProvider>
            <TrackingProvider>
              <PerformanceProvider>
                <HotkeysProvider>
                  <InitializeDemoTenant />
                  <HotkeyManager />
                  <RouterComponent />
                  <Toaster />
                  <PerformanceMetrics />
                  <OfflineIndicator />
                </HotkeysProvider>
              </PerformanceProvider>
            </TrackingProvider>
          </ErrorHandlingProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
