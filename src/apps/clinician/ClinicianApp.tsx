import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNav } from '@/components/mobile/BottomNav';
import { TopBar } from '@/components/mobile/TopBar';
import { useAuthStore } from '@/stores/authStore';
import { Home, ClipboardList, FileText, Users, User } from 'lucide-react';

// Screens
import { HomeScreen } from './screens/HomeScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { NewOrderScreen } from './screens/NewOrderScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ResultDetailScreen } from './screens/ResultDetailScreen';
import { PatientsScreen } from './screens/PatientsScreen';
import { PatientDetailScreen } from './screens/PatientDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CriticalResultsScreen } from './screens/CriticalResultsScreen';
import { TestCatalogScreen } from './screens/TestCatalogScreen';

export function ClinicianApp() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect if not clinician
    if (user && user.role !== 'clinician') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const navItems = [
    { path: '/clinician', icon: Home, label: 'Home' },
    { path: '/clinician/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/clinician/results', icon: FileText, label: 'Results' },
    { path: '/clinician/patients', icon: Users, label: 'Patients' },
    { path: '/clinician/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar title="LabFlow Clinician" showNotifications />
      
      <main className="flex-1 overflow-y-auto pb-16">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/orders/:orderId" element={<OrderDetailScreen />} />
          <Route path="/orders/new" element={<NewOrderScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/results/:resultId" element={<ResultDetailScreen />} />
          <Route path="/patients" element={<PatientsScreen />} />
          <Route path="/patients/:patientId" element={<PatientDetailScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/critical-results" element={<CriticalResultsScreen />} />
          <Route path="/test-catalog" element={<TestCatalogScreen />} />
        </Routes>
      </main>

      <BottomNav items={navItems} />
    </div>
  );
}