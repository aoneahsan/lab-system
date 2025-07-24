import React, { useState } from 'react';
import { AlertTriangle, X, Phone, Mail, MessageSquare } from 'lucide-react';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { useTenant } from '@/hooks/useTenant';

interface CriticalResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    id: string;
    testName: string;
    value: string;
    unit: string;
    patientName: string;
    patientId: string;
    physicianName?: string;
    physicianPhone?: string;
    physicianEmail?: string;
  };
}

const CriticalResultModal: React.FC<CriticalResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const { user } = useAuthStore();
  const { tenant } = useTenant();
  const [notificationMethod, setNotificationMethod] = useState<'phone' | 'email' | 'sms'>('phone');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Notes Required', 'Please add notes about the critical value notification');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create critical notification record
      await addDoc(collection(firestore, `labflow_${tenant?.id}_critical_notifications`), {
        resultId: result.id,
        testName: result.testName,
        value: result.value,
        unit: result.unit,
        patientId: result.patientId,
        patientName: result.patientName,
        physicianName: result.physicianName,
        notificationMethod,
        notes,
        notifiedBy: user?.displayName || user?.email,
        notifiedAt: serverTimestamp(),
        acknowledged: false,
      });

      // Update result with critical notification info
      await updateDoc(doc(firestore, `labflow_${tenant?.id}_results`, result.id), {
        criticalNotification: {
          notified: true,
          notifiedAt: serverTimestamp(),
          notifiedBy: user?.displayName || user?.email,
          method: notificationMethod,
          notes,
        },
        updatedAt: serverTimestamp(),
      });

      toast.success('Critical Value Notified', 'The physician has been notified of the critical result');
      onClose();
    } catch (error) {
      console.error('Error recording critical notification:', error);
      toast.error('Notification Failed', 'Failed to record critical value notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Critical Result Notification</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Result Information */}
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-2">Critical Value Detected</p>
              <div className="space-y-1 text-sm text-red-800">
                <p><span className="font-medium">Test:</span> {result.testName}</p>
                <p><span className="font-medium">Result:</span> {result.value} {result.unit}</p>
                <p><span className="font-medium">Patient:</span> {result.patientName} (ID: {result.patientId})</p>
                {result.physicianName && (
                  <p><span className="font-medium">Physician:</span> {result.physicianName}</p>
                )}
              </div>
            </div>

            {/* Notification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Method
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="phone"
                    checked={notificationMethod === 'phone'}
                    onChange={(e) => setNotificationMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <Phone className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Phone Call</p>
                    {result.physicianPhone && (
                      <p className="text-xs text-gray-500">{result.physicianPhone}</p>
                    )}
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="email"
                    checked={notificationMethod === 'email'}
                    onChange={(e) => setNotificationMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    {result.physicianEmail && (
                      <p className="text-xs text-gray-500">{result.physicianEmail}</p>
                    )}
                  </div>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="sms"
                    checked={notificationMethod === 'sms'}
                    onChange={(e) => setNotificationMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">SMS/Text Message</p>
                    {result.physicianPhone && (
                      <p className="text-xs text-gray-500">{result.physicianPhone}</p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Include: Who was notified, time of notification, any special instructions given..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Confirm Notification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalResultModal;