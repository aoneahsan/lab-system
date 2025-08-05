import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { DefaultRedirect } from '@/components/routing/DefaultRedirect';
import { AdminRouteGuard } from '@/components/routing/AdminRouteGuard';

// Lazy load pages for better performance
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage'));
const PatientDetailPage = lazy(() => import('@/pages/patients/PatientDetailPage'));
const PatientEditPage = lazy(() => import('@/pages/patients/PatientEditPage'));
const TestsPage = lazy(() => import('@/pages/tests/TestsPage'));
const TestDetailPage = lazy(() => import('@/pages/tests/TestDetailPage'));
const TestPanelsPage = lazy(() => import('@/pages/tests/TestPanelsPage'));
const TestOrdersPage = lazy(() => import('@/pages/tests/TestOrdersPage'));
const TestOrderDetailPage = lazy(() => import('@/pages/tests/TestOrderDetailPage'));
const OrderDashboardPage = lazy(() => import('@/pages/orders/OrderDashboard'));
const SamplesPage = lazy(() => import('@/pages/samples/SampleDashboard'));
const SampleDetailPage = lazy(() => import('@/pages/samples/SampleDetailPage'));
const SampleCollectionsPage = lazy(() => import('@/pages/samples/SampleCollectionsPage'));
const SampleScanPage = lazy(() => import('@/pages/samples/SampleScanPage'));
const SampleRegistrationPage = lazy(() => import('@/components/samples/SampleRegistration'));
const ResultsPage = lazy(() => import('@/pages/results/ResultsPage'));
const ResultEntryPage = lazy(() => import('@/pages/results/ResultEntryPage'));
const ResultReviewPage = lazy(() => import('@/pages/results/ResultReviewPage'));
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const InsuranceClaimsPage = lazy(() => import('@/pages/billing/InsuranceClaimsPage'));
const ClaimDetailPage = lazy(() => import('@/pages/billing/ClaimDetailPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/billing/InvoiceDetailPage'));
const PaymentsPage = lazy(() => import('@/pages/billing/PaymentsPage'));
const FinancialReportsPage = lazy(() => import('@/pages/billing/FinancialReportsPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryDashboard'));
const VendorsPage = lazy(() => import('@/pages/inventory/VendorsPage'));
const QualityControlPage = lazy(() => import('@/pages/quality-control/QualityControlPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportDashboard'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const EMRConnectionsPage = lazy(() => import('@/pages/emr/EMRConnectionsPage'));
const EMRConnectionDetailPage = lazy(() => import('@/pages/emr/EMRConnectionDetailPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const BiometricSettingsPage = lazy(() => import('@/pages/settings/BiometricSettingsPage'));
const ValidationRulesPage = lazy(() => import('@/pages/settings/ValidationRulesPage'));
const CustomFieldsPage = lazy(() => import('@/pages/settings/CustomFieldsPage'));
const ResultValidationRulesPage = lazy(() => import('@/pages/results/ValidationRulesPage'));
const AppUpdateSettingsPage = lazy(() => import('@/components/settings/AppUpdateSettings').then(module => ({ default: module.AppUpdateSettings })));
const SetupDemoPage = lazy(() => import('@/pages/setup/SetupDemoPage'));
const CreateSuperAdmin = lazy(() => import('@/pages/setup/CreateSuperAdmin'));
const EquipmentPage = lazy(() => import('@/pages/equipment/EquipmentPage'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));
const VoiceDictationDemo = lazy(() => import('@/pages/demo/VoiceDictationDemo'));
const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'));
const AppointmentDetailPage = lazy(() => import('@/pages/appointments/AppointmentDetailPage'));

// Home Collection Pages
const HomeCollectionPage = lazy(() => import('@/pages/home-collection/HomeCollectionPage'));
const HomeCollectionFormPage = lazy(() => import('@/pages/home-collection/HomeCollectionFormPage'));
const HomeCollectionDetailPage = lazy(() => import('@/pages/home-collection/HomeCollectionDetailPage'));
const RouteManagementPage = lazy(() => import('@/pages/home-collection/RouteManagementPage'));

// Customer Portal
const CustomerPortalPage = lazy(() => import('@/pages/customer-portal/CustomerPortalPage'));

// Workflow Automation
const WorkflowAutomationPage = lazy(() => import('@/pages/workflow/WorkflowAutomationPage'));

// Clinician App
const ClinicianApp = lazy(() =>
  import('@/apps/clinician/ClinicianApp').then((module) => ({ default: module.ClinicianApp }))
);

export const AppRouter = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={isAuthenticated ? <DefaultRedirect /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <DefaultRedirect /> : <RegisterPage />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <DefaultRedirect /> : <ForgotPasswordPage />}
          />
          <Route path="/setup-demo" element={<SetupDemoPage />} />
          <Route path="/setup-super-admin" element={<CreateSuperAdmin />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Onboarding route - outside dashboard layout */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/:appointmentId" element={<AppointmentDetailPage />} />
            <Route path="/home-collection" element={<HomeCollectionPage />} />
            <Route path="/home-collection/new" element={<HomeCollectionFormPage />} />
            <Route path="/home-collection/:collectionId" element={<HomeCollectionDetailPage />} />
            <Route path="/home-collection/routes" element={<RouteManagementPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:patientId" element={<PatientDetailPage />} />
            <Route path="/patients/:patientId/edit" element={<PatientEditPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/tests/panels" element={<TestPanelsPage />} />
            <Route path="/tests/orders" element={<TestOrdersPage />} />
            <Route path="/tests/orders/:orderId" element={<TestOrderDetailPage />} />
            <Route path="/tests/:testId" element={<TestDetailPage />} />
            <Route path="/orders" element={<OrderDashboardPage />} />
            <Route path="/samples" element={<SamplesPage />} />
            <Route path="/samples/register" element={<SampleRegistrationPage />} />
            <Route path="/samples/collections" element={<SampleCollectionsPage />} />
            <Route path="/samples/scan" element={<SampleScanPage />} />
            <Route path="/samples/:sampleId" element={<SampleDetailPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/entry" element={<ResultEntryPage />} />
            <Route path="/results/review" element={<ResultReviewPage />} />
            <Route path="/results/validation-rules" element={<ResultValidationRulesPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/invoices/:invoiceId" element={<InvoiceDetailPage />} />
            <Route path="/billing/payments" element={<PaymentsPage />} />
            <Route path="/billing/claims" element={<InsuranceClaimsPage />} />
            <Route path="/billing/claims/:claimId" element={<ClaimDetailPage />} />
            <Route path="/billing/reports" element={<FinancialReportsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/vendors" element={<VendorsPage />} />
            <Route path="/quality-control" element={<QualityControlPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/emr/connections" element={<EMRConnectionsPage />} />
            <Route path="/emr/connections/:connectionId" element={<EMRConnectionDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/biometric" element={<BiometricSettingsPage />} />
            <Route path="/settings/validation-rules" element={<ValidationRulesPage />} />
            <Route path="/settings/custom-fields" element={<CustomFieldsPage />} />
            <Route path="/settings/updates" element={<AppUpdateSettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/portal" element={<CustomerPortalPage />} />
            <Route path="/workflow" element={<WorkflowAutomationPage />} />
          </Route>
        </Route>

        {/* Demo Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/demo/voice-dictation" element={<VoiceDictationDemo />} />
          </Route>
        </Route>

        {/* Admin Panel Route - Now uses DashboardLayout */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/*" element={
              <AdminRouteGuard>
                <AdminPanel />
              </AdminRouteGuard>
            } />
          </Route>
        </Route>

        {/* Clinician App Routes */}
        <Route element={<ProtectedRoute allowedRoles={['clinician']} />}>
          <Route path="/clinician/*" element={<ClinicianApp />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<DefaultRedirect />} />

        {/* 404 page */}
        <Route
          path="*"
          element={
            <div className="flex justify-center items-center min-h-screen">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Page not found</p>
                <a href="/" className="mt-6 btn btn-primary">
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
