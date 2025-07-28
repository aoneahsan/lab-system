import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { toast } from '@/stores/toast.store';
import { Building2, CheckCircle, Loader2 } from 'lucide-react';

const SetupDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const generateDemoTenant = async () => {
    setIsCreating(true);

    try {
      // Generate a unique demo code
      const demoCode = 'DEMO' + Math.random().toString(36).substring(2, 6).toUpperCase();

      // Create demo tenant
      await setDoc(doc(firestore, 'tenants', demoCode.toLowerCase()), {
        id: demoCode.toLowerCase(),
        code: demoCode,
        name: 'Demo Laboratory',
        type: 'demo',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'DC',
          zipCode: '12345',
          country: 'USA',
        },
        contact: {
          email: 'demo@labflow.com',
          phone: '(555) 123-4567',
          fax: '(555) 123-4568',
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          resultFormat: 'standard',
          criticalValueNotification: true,
        },
        features: {
          billing: true,
          inventory: true,
          qualityControl: true,
          emrIntegration: true,
          mobileApps: true,
        },
        subscription: {
          plan: 'demo',
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCreatedCode(demoCode);
      toast.success('Demo Created', `Your demo laboratory code is: ${demoCode}`);
    } catch (error) {
      console.error('Error creating demo tenant:', error);
      toast.error('Setup Failed', 'Failed to create demo laboratory');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Demo Laboratory
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up a demo laboratory account to explore LabFlow
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!createdCode ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Click the button below to generate a unique demo laboratory code. This will create a
                fully functional demo environment for testing.
              </p>

              <button
                onClick={generateDemoTenant}
                disabled={isCreating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating Demo Laboratory...
                  </>
                ) : (
                  'Create Demo Laboratory'
                )}
              </button>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Registration
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Demo Laboratory Created!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your demo laboratory has been successfully created.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-2">Your laboratory code is:</p>
                <p className="text-2xl font-bold text-gray-900">{createdCode}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Copy this code and use it during registration
                </p>
              </div>

              <button
                onClick={() => navigate('/register')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Registration
              </button>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Demo Features</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Full access to all LabFlow features</li>
              <li>• Pre-loaded sample data for testing</li>
              <li>• Valid for 30 days</li>
              <li>• No credit card required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupDemoPage;
