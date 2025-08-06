import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { setupService } from '@/services/setup.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DebugDashboard = () => {
  const { currentUser, refreshUser } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');

  useEffect(() => {
    const checkData = async () => {
      if (!currentUser) {
        setDebugInfo({ error: 'No user logged in' });
        setLoading(false);
        return;
      }

      const info: any = {
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          tenantId: currentUser.tenantId || 'Not set',
          role: currentUser.role || 'Not set',
        },
        checks: {}
      };

      // Check if tenant document exists
      try {
        const tenantId = currentUser.tenantId || 'demo';
        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
        info.checks.tenantDoc = tenantDoc.exists() ? 'Exists' : 'Not found';
        if (tenantDoc.exists()) {
          info.tenantData = tenantDoc.data();
        }
      } catch (error: any) {
        info.checks.tenantDoc = `Error: ${error.message}`;
      }

      setDebugInfo(info);
      setLoading(false);
    };

    checkData();
  }, [currentUser]);

  const handleSetupDemoTenant = async () => {
    setSetupLoading(true);
    setSetupMessage('');
    
    try {
      setSetupMessage('Creating demo tenant...');
      await setupService.createDemoTenant();
      
      setSetupMessage('Creating demo data...');
      await setupService.createDemoData('demo');
      
      setSetupMessage('✅ Demo tenant and data created successfully!');
      
      // Reload debug info
      window.location.reload();
    } catch (error: any) {
      setSetupMessage(`❌ Error: ${error.message}`);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleUpdateUserTenant = async () => {
    if (!currentUser) return;
    
    setSetupLoading(true);
    setSetupMessage('');
    
    try {
      setSetupMessage('Updating user tenant to demo...');
      await updateDoc(doc(db, 'users', currentUser.uid), {
        tenantId: 'demo',
        updatedAt: new Date()
      });
      
      setSetupMessage('✅ User tenant updated successfully! Please log out and log back in.');
      
      // Refresh user data
      await refreshUser();
      
    } catch (error: any) {
      setSetupMessage(`❌ Error: ${error.message}`);
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Debug Info</h1>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Quick Fix Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>The user's tenantId is: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{currentUser?.tenantId || 'Not set'}</code></li>
          <li>Create a tenant document in Firestore with this ID</li>
          <li>Or update the user's tenantId to 'demo' if using demo tenant</li>
          <li>Make sure the tenant document has all required fields</li>
        </ol>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold mb-2">Quick Actions:</h2>
        
        <div className="space-y-2">
          <button
            onClick={handleSetupDemoTenant}
            disabled={setupLoading}
            className="btn btn-primary mr-4"
          >
            {setupLoading ? <LoadingSpinner size="sm" /> : 'Create Demo Tenant & Data'}
          </button>
          
          {currentUser?.tenantId !== 'demo' && (
            <button
              onClick={handleUpdateUserTenant}
              disabled={setupLoading}
              className="btn btn-secondary"
            >
              {setupLoading ? <LoadingSpinner size="sm" /> : 'Update My Tenant to Demo'}
            </button>
          )}
        </div>
        
        {setupMessage && (
          <div className={`p-4 rounded ${setupMessage.includes('✅') ? 'bg-green-100 text-green-800' : setupMessage.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            {setupMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugDashboard;