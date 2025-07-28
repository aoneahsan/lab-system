import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart,
  Plus,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface QCResult {
  id: string;
  instrumentName: string;
  testName: string;
  level: 'Level 1' | 'Level 2' | 'Level 3';
  value: number;
  mean: number;
  sd: number;
  cv: number;
  status: 'pass' | 'fail' | 'warning';
  performedAt: Date;
  performedBy: string;
  rule?: string;
}

interface QCSchedule {
  id: string;
  instrumentName: string;
  testName: string;
  frequency: 'daily' | 'per shift' | 'weekly';
  lastRun?: Date;
  nextDue: Date;
  status: 'overdue' | 'due' | 'upcoming';
}

const LabStaffQCPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'schedule'>('today');

  // Mock data - in real app would fetch from API
  const [todayQC] = useState<QCResult[]>([
    {
      id: '1',
      instrumentName: 'Chemistry Analyzer A1',
      testName: 'Glucose',
      level: 'Level 2',
      value: 98.5,
      mean: 100,
      sd: 2.5,
      cv: 2.5,
      status: 'pass',
      performedAt: new Date(Date.now() - 30 * 60 * 1000),
      performedBy: 'John Smith',
    },
    {
      id: '2',
      instrumentName: 'Hematology Analyzer H1',
      testName: 'WBC Count',
      level: 'Level 1',
      value: 4.2,
      mean: 5.0,
      sd: 0.3,
      cv: 6.0,
      status: 'warning',
      performedAt: new Date(Date.now() - 60 * 60 * 1000),
      performedBy: 'Jane Doe',
      rule: '2-2s',
    },
    {
      id: '3',
      instrumentName: 'Chemistry Analyzer A1',
      testName: 'Creatinine',
      level: 'Level 1',
      value: 0.75,
      mean: 0.8,
      sd: 0.05,
      cv: 6.25,
      status: 'fail',
      performedAt: new Date(Date.now() - 90 * 60 * 1000),
      performedBy: 'Mike Johnson',
      rule: '1-3s',
    },
  ]);

  const [qcSchedule] = useState<QCSchedule[]>([
    {
      id: '1',
      instrumentName: 'Chemistry Analyzer A1',
      testName: 'Glucose',
      frequency: 'per shift',
      lastRun: new Date(Date.now() - 8 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() + 30 * 60 * 1000),
      status: 'due',
    },
    {
      id: '2',
      instrumentName: 'Immunoassay I1',
      testName: 'TSH',
      frequency: 'daily',
      lastRun: new Date(Date.now() - 25 * 60 * 60 * 1000),
      nextDue: new Date(Date.now() - 60 * 60 * 1000),
      status: 'overdue',
    },
    {
      id: '3',
      instrumentName: 'Coagulation C1',
      testName: 'PT/INR',
      frequency: 'per shift',
      nextDue: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: 'upcoming',
    },
  ]);

  const getStatusIcon = (status: QCResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getScheduleStatusColor = (status: QCSchedule['status']) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'due':
        return 'text-orange-600 bg-orange-50';
      case 'upcoming':
        return 'text-blue-600 bg-blue-50';
    }
  };

  const handleRunQC = (scheduleId: string) => {
    // Navigate to QC entry page
    toast.info('Opening QC entry form...');
  };

  const handleViewChart = (resultId: string) => {
    // Navigate to Levey-Jennings chart
    toast.info('Opening Levey-Jennings chart...');
  };

  const tabs = [
    { id: 'today', label: "Today's QC", icon: Activity },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ];

  const qcStats = {
    total: todayQC.length,
    passed: todayQC.filter((qc) => qc.status === 'pass').length,
    failed: todayQC.filter((qc) => qc.status === 'fail').length,
    warning: todayQC.filter((qc) => qc.status === 'warning').length,
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
          <button
            onClick={() => toast.info('Opening QC entry form...')}
            className="p-2 bg-purple-600 text-white rounded-lg"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* QC Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{qcStats.total}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{qcStats.passed}</p>
            <p className="text-xs text-gray-600">Passed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{qcStats.warning}</p>
            <p className="text-xs text-gray-600">Warning</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{qcStats.failed}</p>
            <p className="text-xs text-gray-600">Failed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        {activeTab === 'today' && (
          <div className="space-y-3">
            {todayQC.map((qc) => (
              <div key={qc.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{qc.instrumentName}</h3>
                    <p className="text-sm text-gray-600">
                      {qc.testName} - {qc.level}
                    </p>
                  </div>
                  {getStatusIcon(qc.status)}
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Value</p>
                    <p className="font-medium">{qc.value}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mean ± SD</p>
                    <p className="font-medium">
                      {qc.mean} ± {qc.sd}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">CV%</p>
                    <p className="font-medium">{qc.cv}%</p>
                  </div>
                </div>

                {qc.rule && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded text-sm">
                    <p className="text-yellow-800">Westgard Rule Violation: {qc.rule}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <p>
                    By {qc.performedBy} • {qc.performedAt.toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => handleViewChart(qc.id)}
                    className="flex items-center gap-1 text-purple-600"
                  >
                    <BarChart className="h-4 w-4" />
                    View Chart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {qcSchedule.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{schedule.instrumentName}</h3>
                    <p className="text-sm text-gray-600">{schedule.testName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getScheduleStatusColor(
                      schedule.status
                    )}`}
                  >
                    {schedule.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Frequency</p>
                    <p className="font-medium capitalize">{schedule.frequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Next Due</p>
                    <p className="font-medium">
                      {schedule.nextDue.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {schedule.lastRun && (
                  <p className="text-xs text-gray-500 mb-3">
                    Last run: {schedule.lastRun.toLocaleString()}
                  </p>
                )}

                {(schedule.status === 'due' || schedule.status === 'overdue') && (
                  <button
                    onClick={() => handleRunQC(schedule.id)}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                  >
                    Run QC Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center py-8">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">QC history coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabStaffQCPage;
