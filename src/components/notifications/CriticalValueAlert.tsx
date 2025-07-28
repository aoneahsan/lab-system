import React, { useState } from 'react';
import { notificationService } from '../../services/notifications';
import type { CriticalValueNotification } from '../../services/notifications';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CriticalValueAlertProps {
  notification: CriticalValueNotification;
  onAcknowledge: () => void;
  onClose: () => void;
}

const CriticalValueAlert: React.FC<CriticalValueAlertProps> = ({
  notification,
  onAcknowledge,
  onClose,
}) => {
  const [notes, setNotes] = useState('');
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      await notificationService.acknowledgeCriticalValue(
        notification.patientId, // Would be notificationId in real implementation
        notes
      );
      onAcknowledge();
    } catch (error) {
      console.error('Error acknowledging critical value:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-red-50 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Critical Value Alert
                </h3>
                <div className="mt-2">
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      <strong>Patient:</strong> {notification.patientName}
                    </p>
                    <p>
                      <strong>Test:</strong> {notification.testName}
                    </p>
                    <p className="text-red-600 font-semibold">
                      <strong>Value:</strong> {notification.value}
                    </p>
                    <p>
                      <strong>Critical Range:</strong> {notification.criticalRange}
                    </p>
                    <p>
                      <strong>Ordering Provider:</strong> {notification.orderingProvider}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 sm:px-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Acknowledgment Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder="Provider notified, action taken, etc."
            />
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Critical Value'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalValueAlert;
