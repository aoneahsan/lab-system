import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { useTenant } from '@/hooks/useTenant';
import { COLLECTIONS } from '@/config/firebase-collections';
import CriticalResultModal from './CriticalResultModal';

interface CriticalResult {
  id: string;
  resultId: string;
  testName: string;
  value: string;
  unit: string;
  patientName: string;
  patientId: string;
  physicianName?: string;
  notificationStatus: 'pending' | 'notified' | 'acknowledged';
  criticalType: 'high' | 'low';
  createdAt: Date;
  notifiedAt?: Date;
  acknowledgedAt?: Date;
}

const CriticalResultsDashboard: React.FC = () => {
  const { tenant } = useTenant();
  const [selectedResult, setSelectedResult] = useState<CriticalResult | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'notified' | 'acknowledged'>('all');

  // Fetch critical results
  const { data: criticalResults = [], isLoading } = useQuery({
    queryKey: ['criticalResults', tenant?.id, filterStatus],
    queryFn: async () => {
      if (!tenant) return [];

      const q = query(
        collection(firestore, COLLECTIONS.RESULTS),
        where('flag', 'in', ['critical_high', 'critical_low']),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        notifiedAt: doc.data().criticalNotification?.notifiedAt?.toDate(),
        acknowledgedAt: doc.data().criticalNotification?.acknowledgedAt?.toDate(),
        notificationStatus: doc.data().criticalNotification?.notified 
          ? doc.data().criticalNotification?.acknowledged 
            ? 'acknowledged' 
            : 'notified'
          : 'pending',
        criticalType: doc.data().flag === 'critical_high' ? 'high' : 'low'
      })) as CriticalResult[];
    },
    enabled: !!tenant,
  });

  const filteredResults = criticalResults.filter(result => {
    if (filterStatus === 'all') return true;
    return result.notificationStatus === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'notified':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeElapsed = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const handleNotify = (result: CriticalResult) => {
    setSelectedResult(result);
    setShowNotificationModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-medium text-gray-900">Critical Results</h2>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(['all', 'pending', 'notified', 'acknowledged'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  filterStatus === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({criticalResults.filter(r => r.notificationStatus === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No critical results found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getTimeElapsed(result.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{result.patientName}</div>
                      <div className="text-sm text-gray-500">ID: {result.patientId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.testName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      result.criticalType === 'high' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {result.criticalType === 'high' ? '↑↑' : '↓↓'} {result.value} {result.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.notificationStatus)}`}>
                      {result.notificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {result.notificationStatus === 'pending' ? (
                      <button
                        onClick={() => handleNotify(result)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-900"
                      >
                        <Phone className="h-4 w-4" />
                        Notify
                      </button>
                    ) : result.notificationStatus === 'notified' ? (
                      <button
                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-gray-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Critical Result Notification Modal */}
      {selectedResult && (
        <CriticalResultModal
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            setSelectedResult(null);
          }}
          result={{
            id: selectedResult.resultId,
            testName: selectedResult.testName,
            value: selectedResult.value,
            unit: selectedResult.unit,
            patientName: selectedResult.patientName,
            patientId: selectedResult.patientId,
            physicianName: selectedResult.physicianName,
          }}
        />
      )}
    </div>
  );
};

export default CriticalResultsDashboard;