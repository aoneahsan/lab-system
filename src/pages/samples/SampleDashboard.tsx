import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, TestTube, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useSampleStore } from '@/stores/sample.store';
import SampleList from '@/components/samples/SampleList';
import SampleStorage from '@/components/samples/SampleStorage';
import ChainOfCustody from '@/components/samples/ChainOfCustody';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const tabs = [
  { id: 'list', label: 'Sample List', icon: TestTube },
  { id: 'storage', label: 'Storage Management', icon: Package },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
];

export default function SampleDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  
  const { currentUser } = useAuthStore();
  const { 
    statistics, 
    loading, 
    fetchSampleStatistics,
    currentSample,
    fetchSample
  } = useSampleStore();
  
  const tenantId = currentUser?.tenantId || '';

  useEffect(() => {
    if (tenantId) {
      fetchSampleStatistics(tenantId);
    }
  }, [tenantId, fetchSampleStatistics]);

  useEffect(() => {
    if (selectedSample && tenantId) {
      fetchSample(tenantId, selectedSample);
    }
  }, [selectedSample, tenantId, fetchSample]);

  const handleSampleSelect = (sampleId: string) => {
    setSelectedSample(sampleId);
  };

  if (loading && !statistics) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sample Management</h1>
        <button
          onClick={() => navigate('/samples/register')}
          className="btn btn-primary"
        >
          Register New Sample
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Samples</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statistics.totalSamples}
                </p>
              </div>
              <TestTube className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Samples</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statistics.todaysSamples}
                </p>
              </div>
              <Clock className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statistics.pendingSamples}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statistics.samplesByStatus?.completed || 0}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' && <SampleList />}
          {activeTab === 'storage' && <SampleStorage />}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Sample Statistics</h3>
              
              {/* Sample by Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Samples by Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statistics?.samplesByStatus && Object.entries(statistics.samplesByStatus).map(([status, count]) => (
                    <div key={status} className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                      <p className="text-xl font-semibold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample by Type */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Samples by Type</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statistics?.samplesByType && Object.entries(statistics.samplesByType).map(([type, count]) => (
                    <div key={type} className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs text-gray-600 capitalize">{type}</p>
                      <p className="text-xl font-semibold text-gray-900">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chain of Custody Modal/Sidebar */}
      {selectedSample && currentSample && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedSample(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Sample Details</h2>
                <button
                  onClick={() => setSelectedSample(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <ChainOfCustody
                  entries={currentSample.chainOfCustody}
                  sampleNumber={currentSample.sampleNumber}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}