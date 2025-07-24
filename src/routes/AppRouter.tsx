import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

// Lazy load pages for better performance
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(
	() => import('@/pages/auth/ForgotPasswordPage')
);
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage'));
const PatientDetailPage = lazy(
	() => import('@/pages/patients/PatientDetailPage')
);
const TestsPage = lazy(() => import('@/pages/tests/TestsPage'));
const TestDetailPage = lazy(() => import('@/pages/tests/TestDetailPage'));
const TestPanelsPage = lazy(() => import('@/pages/tests/TestPanelsPage'));
const TestOrdersPage = lazy(() => import('@/pages/tests/TestOrdersPage'));
const TestOrderDetailPage = lazy(
	() => import('@/pages/tests/TestOrderDetailPage')
);
const SamplesPage = lazy(() => import('@/pages/samples/SamplesPage'));
const SampleDetailPage = lazy(() => import('@/pages/samples/SampleDetailPage'));
const SampleCollectionsPage = lazy(
	() => import('@/pages/samples/SampleCollectionsPage')
);
const SampleScanPage = lazy(() => import('@/pages/samples/SampleScanPage'));
const ResultsPage = lazy(() => import('@/pages/results/ResultsPage'));
const ResultEntryPage = lazy(() => import('@/pages/results/ResultEntryPage'));
const ResultReviewPage = lazy(() => import('@/pages/results/ResultReviewPage'));
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const InsuranceClaimsPage = lazy(() => import('@/pages/billing/InsuranceClaimsPage'));
const ClaimDetailPage = lazy(() => import('@/pages/billing/ClaimDetailPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const QualityControlPage = lazy(
	() => import('@/pages/quality-control/QualityControlPage')
);
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const EMRConnectionsPage = lazy(() => import('@/pages/emr/EMRConnectionsPage'));
const EMRConnectionDetailPage = lazy(
	() => import('@/pages/emr/EMRConnectionDetailPage')
);
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const BiometricSettingsPage = lazy(
	() => import('@/pages/settings/BiometricSettingsPage')
);
const ValidationRulesPage = lazy(
	() => import('@/pages/settings/ValidationRulesPage')
);
const SetupDemoPage = lazy(() => import('@/pages/setup/SetupDemoPage'));

export const AppRouter = () => {
	const { isAuthenticated } = useAuthStore();

	return (
		<Suspense fallback={<LoadingScreen />}>
			<Routes>
				{/* Public routes */}
				<Route element={<AuthLayout />}>
					<Route
						path='/login'
						element={
							isAuthenticated ? <Navigate to='/dashboard' /> : <LoginPage />
						}
					/>
					<Route
						path='/register'
						element={
							isAuthenticated ? <Navigate to='/dashboard' /> : <RegisterPage />
						}
					/>
					<Route
						path='/forgot-password'
						element={
							isAuthenticated ? (
								<Navigate to='/dashboard' />
							) : (
								<ForgotPasswordPage />
							)
						}
					/>
					<Route path='/setup-demo' element={<SetupDemoPage />} />
				</Route>

				{/* Protected routes */}
				<Route element={<ProtectedRoute />}>
					<Route element={<DashboardLayout />}>
						<Route path='/dashboard' element={<DashboardPage />} />
						<Route path='/patients' element={<PatientsPage />} />
						<Route
							path='/patients/:patientId'
							element={<PatientDetailPage />}
						/>
						<Route path='/tests' element={<TestsPage />} />
						<Route path='/tests/panels' element={<TestPanelsPage />} />
						<Route path='/tests/orders' element={<TestOrdersPage />} />
						<Route
							path='/tests/orders/:orderId'
							element={<TestOrderDetailPage />}
						/>
						<Route path='/tests/:testId' element={<TestDetailPage />} />
						<Route path='/samples' element={<SamplesPage />} />
						<Route path='/samples/collections' element={<SampleCollectionsPage />} />
						<Route path='/samples/scan' element={<SampleScanPage />} />
						<Route path='/samples/:sampleId' element={<SampleDetailPage />} />
						<Route path='/results' element={<ResultsPage />} />
						<Route path='/results/entry' element={<ResultEntryPage />} />
						<Route path='/results/review' element={<ResultReviewPage />} />
						<Route path='/billing' element={<BillingPage />} />
						<Route path='/billing/claims' element={<InsuranceClaimsPage />} />
						<Route path='/billing/claims/:claimId' element={<ClaimDetailPage />} />
						<Route path='/inventory' element={<InventoryPage />} />
						<Route path='/quality-control' element={<QualityControlPage />} />
						<Route path='/reports' element={<ReportsPage />} />
						<Route path='/analytics' element={<AnalyticsPage />} />
						<Route path='/emr/connections' element={<EMRConnectionsPage />} />
						<Route
							path='/emr/connections/:connectionId'
							element={<EMRConnectionDetailPage />}
						/>
						<Route path='/settings' element={<SettingsPage />} />
						<Route
							path='/settings/biometric'
							element={<BiometricSettingsPage />}
						/>
						<Route
							path='/settings/validation-rules'
							element={<ValidationRulesPage />}
						/>
						<Route path='/profile' element={<ProfilePage />} />
					</Route>
				</Route>

				{/* Default redirect */}
				<Route
					path='/'
					element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />}
				/>

				{/* 404 page */}
				<Route
					path='*'
					element={
						<div className='min-h-screen flex items-center justify-center'>
							<div className='text-center'>
								<h1 className='text-6xl font-bold text-gray-300 dark:text-gray-700'>
									404
								</h1>
								<p className='text-xl text-gray-600 dark:text-gray-400 mt-4'>
									Page not found
								</p>
								<a href='/' className='btn btn-primary mt-6'>
									Go to Home
								</a>
							</div>
						</div>
					}
				/>
			</Routes>
		</Suspense>
	);
};
