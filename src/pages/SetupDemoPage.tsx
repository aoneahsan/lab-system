import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/stores/toast.store';

const SetupDemoPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const createDemoTenant = async () => {
    setIsCreating(true);

    try {
      console.log('🚀 Creating demo tenant...');

      // Create demo tenant
      const tenantId = 'demo';
      const tenantData = {
        id: tenantId,
        name: 'Demo Laboratory',
        code: 'DEMO',
        type: 'clinical_lab',
        address: {
          street: '123 Lab Street',
          city: 'Demo City',
          state: 'DS',
          zipCode: '12345',
          country: 'USA',
        },
        contact: {
          phone: '+1 (555) 123-4567',
          email: 'admin@demolab.com',
          website: 'https://demolab.com',
        },
        settings: {
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',
          language: 'en',
        },
        features: {
          emrIntegration: true,
          barcodeScanning: true,
          biometricAuth: true,
          mobileApp: true,
          patientPortal: true,
        },
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'tenants', tenantId), tenantData);

      toast.success('Demo tenant created!', 'Now you can register with tenant code: DEMO');
      navigate('/register');
    } catch (error) {
      console.error('❌ Error creating demo tenant:', error);
      toast.error('Setup failed', 'Could not create demo tenant');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Setup Demo Environment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click the button below to create a demo tenant for testing.
          </p>

          <button
            onClick={createDemoTenant}
            disabled={isCreating}
            className="btn btn-primary w-full"
          >
            {isCreating ? 'Creating Demo Tenant...' : 'Create Demo Tenant'}
          </button>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            After creating the demo tenant, register with:
            <br />
            <span className="font-mono font-bold">Tenant Code: DEMO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupDemoPage;
