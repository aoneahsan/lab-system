import React, { useState } from 'react';
import {
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Package,
  ClipboardCheck,
  BarChart3,
  AlertTriangle,
  Beaker,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface LabStats {
  pendingSamples: number;
  inProgress: number;
  completedToday: number;
  criticalResults: number;
  qcPending: number;
  tat: number; // Turnaround time in minutes
  efficiency: number;
}

interface CriticalResult {
  id: string;
  patientName: string;
  testName: string;
  result: string;
  criticality: 'high' | 'urgent';
  time: string;
}

interface PendingSample {
  id: string;
  sampleId: string;
  patientName: string;
  tests: string[];
  priority: 'routine' | 'urgent' | 'stat';
  receivedTime: Date;
}

export const HomeScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [stats] = useState<LabStats>({
    pendingSamples: 12,
    inProgress: 8,
    completedToday: 47,
    criticalResults: 3,
    qcPending: 2,
    tat: 45,
    efficiency: 92,
  });

  const [criticalResults] = useState<CriticalResult[]>([
    {
      id: '1',
      patientName: 'Emma Wilson',
      testName: 'Glucose',
      result: '320 mg/dL (H)',
      criticality: 'high',
      time: '10 min ago',
    },
    {
      id: '2',
      patientName: 'James Chen',
      testName: 'Potassium',
      result: '6.2 mEq/L (H)',
      criticality: 'urgent',
      time: '25 min ago',
    },
    {
      id: '3',
      patientName: 'Sarah Brown',
      testName: 'Hemoglobin',
      result: '6.5 g/dL (L)',
      criticality: 'high',
      time: '45 min ago',
    },
  ]);

  const [pendingSamples] = useState<PendingSample[]>([
    {
      id: '1',
      sampleId: 'ST2024001',
      patientName: 'John Doe',
      tests: ['CBC', 'Chemistry Panel'],
      priority: 'stat',
      receivedTime: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: '2',
      sampleId: 'ST2024002',
      patientName: 'Mary Johnson',
      tests: ['Lipid Panel', 'HbA1c'],
      priority: 'routine',
      receivedTime: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]);

  const getTimeElapsed = (time: Date) => {
    const minutes = Math.floor((Date.now() - time.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="overflow-y-auto flex-1 bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Welcome Card */}
        <div className="p-4 text-white bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
          <h2 className="text-xl font-semibold">
            Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Technician'}!
          </h2>
          <p className="mt-1 text-blue-100">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{stats.pendingSamples}</p>
                  <p className="text-sm text-blue-100">Pending</p>
                </div>
                <TestTube className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{stats.tat}m</p>
                  <p className="text-sm text-blue-100">Avg TAT</p>
                </div>
                <Clock className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Critical Results Alert */}
        {criticalResults.length > 0 && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Critical Results</h3>
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {criticalResults.length}
                </span>
              </div>
              <button
                onClick={() => navigate('/lab-staff/critical-results')}
                className="text-sm font-medium text-red-600"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {criticalResults.slice(0, 2).map((result) => (
                <div key={result.id} className="p-3 bg-white rounded border border-red-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{result.patientName}</p>
                      <p className="text-sm text-gray-600">
                        {result.testName}:{' '}
                        <span className="font-semibold text-red-600">{result.result}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{result.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">QC Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qcPending}</p>
              </div>
              <ClipboardCheck className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{stats.efficiency}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Pending Samples */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Pending Samples</h3>
              <button
                onClick={() => navigate('/lab-staff/samples')}
                className="text-sm font-medium text-indigo-600"
              >
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingSamples.map((sample) => (
              <div
                key={sample.id}
                onClick={() => navigate(`/lab-staff/sample/${sample.sampleId}`)}
                className="p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{sample.sampleId}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(
                          sample.priority
                        )}`}
                      >
                        {sample.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{sample.patientName}</p>
                    <p className="mt-1 text-xs text-gray-500">{sample.tests.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {getTimeElapsed(sample.receivedTime)}
                    </p>
                    <p className="text-xs text-gray-500">waiting</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/lab-staff/scan-sample')}
            className="flex flex-col items-center p-4 space-y-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Package className="w-8 h-8 text-indigo-600" />
            <span className="text-sm font-medium text-gray-900">Scan Sample</span>
          </button>
          <button
            onClick={() => navigate('/lab-staff/qc')}
            className="flex flex-col items-center p-4 space-y-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Beaker className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Run QC</span>
          </button>
          <button
            onClick={() => navigate('/lab-staff/reports')}
            className="flex flex-col items-center p-4 space-y-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Reports</span>
          </button>
          <button
            onClick={() => navigate('/lab-staff/critical')}
            className="flex flex-col items-center p-4 space-y-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <AlertCircle className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-gray-900">Critical</span>
          </button>
        </div>
      </div>
    </div>
  );
};
