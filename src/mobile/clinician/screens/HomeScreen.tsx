import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const stats = [
    { label: 'Active Patients', value: '48', icon: Users, color: 'bg-blue-100 text-blue-800' },
    { label: 'Pending Orders', value: '12', icon: ClipboardList, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Critical Results', value: '3', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
    { label: 'Today\'s Reviews', value: '27', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  ];

  const recentPatients = [
    {
      id: '1',
      name: 'John Doe',
      mrn: 'MRN123456',
      lastTest: 'CBC, Lipid Panel',
      status: 'critical',
      time: '10 mins ago',
    },
    {
      id: '2',
      name: 'Jane Smith',
      mrn: 'MRN123457',
      lastTest: 'HbA1c',
      status: 'normal',
      time: '1 hour ago',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      mrn: 'MRN123458',
      lastTest: 'Blood Culture',
      status: 'pending',
      time: '2 hours ago',
    },
  ];

  const criticalAlerts = [
    {
      id: '1',
      patient: 'John Doe',
      test: 'Potassium',
      value: '6.2 mmol/L',
      range: '3.5-5.1 mmol/L',
      severity: 'critical',
    },
    {
      id: '2',
      patient: 'Mary Wilson',
      test: 'Glucose',
      value: '28 mg/dL',
      range: '70-110 mg/dL',
      severity: 'critical',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'normal':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6">
        <h1 className="text-2xl font-bold">
          Welcome, Dr. {currentUser?.lastName || 'Smith'}
        </h1>
        <p className="text-blue-100 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 -mt-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-5 w-5 text-gray-600" />
                <span className={`text-xs px-2 py-1 rounded-full ${stat.color}`}>
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-medium text-red-900">Critical Results Requiring Review</h3>
            </div>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="bg-white rounded p-3 border border-red-100"
                  onClick={() => navigate(`/clinician/patient/${alert.id}/results`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{alert.patient}</p>
                      <p className="text-sm text-gray-600">{alert.test}: {alert.value}</p>
                      <p className="text-xs text-gray-500">Normal: {alert.range}</p>
                    </div>
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                      Critical
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Patients */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
          <button 
            onClick={() => navigate('/clinician/patients')}
            className="text-sm text-indigo-600 font-medium"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-lg shadow-sm p-4"
              onClick={() => navigate(`/clinician/patient/${patient.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-500">{patient.mrn}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Last tests: {patient.lastTest}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{patient.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/clinician/orders/new')}
            className="bg-indigo-600 text-white p-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            New Lab Order
          </button>
          <button 
            onClick={() => navigate('/clinician/results')}
            className="bg-white border border-gray-300 text-gray-700 p-4 rounded-lg font-medium hover:bg-gray-50"
          >
            Review Results
          </button>
        </div>
      </div>
    </div>
  );
};