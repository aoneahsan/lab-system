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
		initializeAuth().finally(() => {
			performanceMonitor.stopTrace('app_initialization');
		});
	}, [initializeAuth]);

	if (isLoading) {
		return <LoadingScreen />;
	}

	// Use mobile app for native platforms
	const RouterComponent = isNativePlatform ? MobileAppSelector : AppRouter;

	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<PerformanceProvider>
					<BrowserRouter>
						<InitializeDemoTenant />
						<RouterComponent />
						<Toaster />
						<PerformanceMetrics />
						<OfflineIndicator />
					</BrowserRouter>
					<ReactQueryDevtools initialIsOpen={false} />
				</PerformanceProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	);
}

export default App;
