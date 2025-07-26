import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNav } from '@/components/mobile/BottomNav';
import { TopBar } from '@/components/mobile/TopBar';
import { useAuthStore } from '@/stores/auth.store';
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
  const { currentUser } = useAuthStore();

  useEffect(() => {
    // Redirect if not clinician
    if (currentUser && currentUser.role !== 'clinician') {
      navigate('/unauthorized');
    }
  }, [currentUser, navigate]);

  const navItems = [
    { path: '/clinician', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { path: '/clinician/orders', icon: <ClipboardList className="w-6 h-6" />, label: 'Orders' },
    { path: '/clinician/results', icon: <FileText className="w-6 h-6" />, label: 'Results' },
    { path: '/clinician/patients', icon: <Users className="w-6 h-6" />, label: 'Patients' },
    { path: '/clinician/profile', icon: <User className="w-6 h-6" />, label: 'Profile' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar title="LabFlow Clinician" />
      
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