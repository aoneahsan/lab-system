import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { useQualityControlStore } from '@/stores/quality-control.store';
import QCTestList from './QCTestList';
import QCResultEntry from './QCResultEntry';
import LeveyJenningsChart from './LeveyJenningsChart';
import QCStatistics from './QCStatistics';

export default function QCDashboard() {
  const [activeTab, setActiveTab] = useState('tests');
  const { fetchQCTests } = useQualityControlStore();

  useEffect(() => {
    fetchQCTests();
  }, [fetchQCTests]);

  const tabs = [
    { id: 'tests', label: 'QC Tests', icon: FileText },
    { id: 'entry', label: 'Result Entry', icon: Activity },
    { id: 'charts', label: 'Levey-Jennings', icon: TrendingUp },
    { id: 'statistics', label: 'Statistics', icon: CheckCircle },
  ];

  const getTodayStats = () => {
    // This would normally fetch from the service
    return {
      totalRuns: 45,
      accepted: 42,
      warnings: 2,
      rejected: 1,
    };
  };

  const stats = getTodayStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
        <p className="text-gray-600 mt-1">Monitor and manage laboratory quality control</p>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's QC Runs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRuns}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'tests' && <QCTestList />}
          {activeTab === 'entry' && <QCResultEntry />}
          {activeTab === 'charts' && <LeveyJenningsChart />}
          {activeTab === 'statistics' && <QCStatistics />}
        </div>
      </div>
    </div>
  );
}
