import React, { useState } from 'react';
import {
  Calendar,
  Users,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
  Bell,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ClinicianStats {
  activePatients: number;
  pendingOrders: number;
  criticalResults: number;
  todayAppointments: number;
  avgResponseTime: number;
  patientSatisfaction: number;
}

interface CriticalResult {
  id: string;
  patientName: string;
  testName: string;
  result: string;
  timeAgo: string;
  acknowledged: boolean;
}

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  type: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export const HomeScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [stats] = useState<ClinicianStats>({
    activePatients: 142,
    pendingOrders: 8,
    criticalResults: 3,
    todayAppointments: 12,
    avgResponseTime: 2.5,
    patientSatisfaction: 94
  });

  const [criticalResults] = useState<CriticalResult[]>([
    {
      id: '1',
      patientName: 'Emma Wilson',
      testName: 'Troponin I',
      result: '2.5 ng/mL (H)',
      timeAgo: '15 min',
      acknowledged: false
    },
    {
      id: '2',
      patientName: 'James Chen',
      testName: 'Glucose',
      result: '42 mg/dL (L)',
      timeAgo: '1 hour',
      acknowledged: false
    },
    {
      id: '3',
      patientName: 'Sarah Johnson',
      testName: 'INR',
      result: '5.2 (H)',
      timeAgo: '2 hours',
      acknowledged: true
    }
  ]);

  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      time: '09:00 AM',
      patientName: 'Michael Brown',
      type: 'Follow-up',
      status: 'completed'
    },
    {
      id: '2',
      time: '10:30 AM',
      patientName: 'Lisa Davis',
      type: 'Consultation',
      status: 'in-progress'
    },
    {
      id: '3',
      time: '11:00 AM',
      patientName: 'Robert Wilson',
      type: 'Test Review',
      status: 'scheduled'
    }
  ]);

  const handleAcknowledge = (resultId: string) => {
    console.log('Acknowledging result:', resultId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-4 text-white">
          <h2 className="text-xl font-semibold">
            Good {format(new Date(), 'a')}, Dr. {currentUser?.displayName?.split(' ').pop() || 'Smith'}
          </h2>
          <p className="text-indigo-100 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                  <p className="text-sm text-indigo-100">Appointments</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-200" />
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.criticalResults}</p>
                  <p className="text-sm text-indigo-100">Critical</p>
                </div>
                <AlertCircle className="h-8 w-8 text-indigo-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Critical Results Alert */}
        {criticalResults.filter(r => !r.acknowledged).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Critical Results</h3>
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {criticalResults.filter(r => !r.acknowledged).length} new
                </span>
              </div>
              <button
                onClick={() => navigate('/clinician/critical-results')}
                className="text-sm text-red-600 font-medium"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {criticalResults.filter(r => !r.acknowledged).slice(0, 2).map((result) => (
                <div
                  key={result.id}
                  className="bg-white rounded p-3 border border-red-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.patientName}</p>
                      <p className="text-sm text-gray-600">
                        {result.testName}: <span className="font-semibold text-red-600">{result.result}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{result.timeAgo} ago</p>
                    </div>
                    <button
                      onClick={() => handleAcknowledge(result.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-full"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{stats.patientSatisfaction}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
              <button
                onClick={() => navigate('/clinician/appointments')}
                className="text-sm text-indigo-600 font-medium"
              >
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => navigate(`/clinician/appointment/${appointment.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(appointment.status)}
                    <div>
                      <p className="font-medium text-gray-900">{appointment.time}</p>
                      <p className="text-sm text-gray-600">{appointment.patientName}</p>
                      <p className="text-xs text-gray-500">{appointment.type}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/clinician/new-order')}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-gray-50"
          >
            <FileText className="h-8 w-8 text-indigo-600" />
            <span className="text-sm font-medium text-gray-900">New Order</span>
          </button>
          <button
            onClick={() => navigate('/clinician/quick-results')}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-gray-50"
          >
            <Zap className="h-8 w-8 text-yellow-600" />
            <span className="text-sm font-medium text-gray-900">Quick Results</span>
          </button>
          <button
            onClick={() => navigate('/clinician/messages')}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-gray-50"
          >
            <Bell className="h-8 w-8 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Messages</span>
          </button>
          <button
            onClick={() => navigate('/clinician/analytics')}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-gray-50"
          >
            <Activity className="h-8 w-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};