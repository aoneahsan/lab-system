import React, { useState } from 'react';
import { BeakerIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/auth.store';

const DemoDataLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const user = useAuthStore((state) => state.currentUser);

  const loadDemoData = async () => {
    if (!user || (user.role !== 'super_admin' && user.role !== 'lab_admin')) {
      setStatus('Only administrators can load demo data');
      return;
    }

    setIsLoading(true);
    setStatus('Loading demo data...');

    try {
      // Load demo data from the generated JSON file
      const response = await fetch('/src/data/demo.json');
      const demoData = await response.json();

      setStatus(`Loaded ${demoData.metadata.counts.patients} patients, ${demoData.metadata.counts.orders} orders, and ${demoData.metadata.counts.results} results`);

      // In a real implementation, you would upload this data to Firebase
      // For now, we'll store it in localStorage for demo purposes
      localStorage.setItem('labflow_demo_data', JSON.stringify(demoData));
      
      setStatus('Demo data loaded successfully! Refresh the page to see the data.');
    } catch (error) {
      console.error('Error loading demo data:', error);
      setStatus('Error loading demo data. Please run "yarn generate:demo" first.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Demo Data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Load sample data for testing and demonstration
        </p>
        <div className="mt-6">
          <button
            onClick={loadDemoData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <CloudArrowUpIcon className="animate-pulse -ml-1 mr-2 h-5 w-5" />
                Loading...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                Load Demo Data
              </>
            )}
          </button>
        </div>
        {status && (
          <p className="mt-4 text-sm text-gray-600">{status}</p>
        )}
      </div>
    </div>
  );
};

export default DemoDataLoader;