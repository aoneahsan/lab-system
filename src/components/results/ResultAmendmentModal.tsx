import React, { useState } from 'react';
import { X, AlertCircle, Clock, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { COLLECTIONS } from '@/config/firebase-collections';
import { toast } from '@/stores/toast.store';
import type { TestResult } from '@/types/result.types';

interface ResultAmendmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult;
}

interface Amendment {
  timestamp: Date;
  amendedBy: string;
  previousValue: string;
  newValue: string;
  reason: string;
  notes?: string;
}

const ResultAmendmentModal: React.FC<ResultAmendmentModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const { user } = useAuthStore();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    newValue: result.value,
    reason: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const amendResultMutation = useMutation({
    mutationFn: async () => {
      if (!tenant || !user) throw new Error('Missing tenant or user');

      const amendment: Amendment = {
        timestamp: new Date(),
        amendedBy: user.displayName || user.email || 'Unknown',
        previousValue: result.value,
        newValue: formData.newValue,
        reason: formData.reason,
        notes: formData.notes || undefined,
      };

      await updateDoc(doc(firestore, COLLECTIONS.RESULTS, result.id), {
        value: formData.newValue,
        amendments: arrayUnion(amendment),
        amendedAt: serverTimestamp(),
        amendedBy: user.displayName || user.email,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      toast.success('Result Amended', 'The test result has been successfully amended');
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['result', result.id] });
      onClose();
    },
    onError: (error) => {
      toast.error('Amendment Failed', 'Failed to amend the result');
      console.error('Amendment error:', error);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newValue) {
      newErrors.newValue = 'New value is required';
    }
    if (formData.newValue === result.value) {
      newErrors.newValue = 'New value must be different from current value';
    }
    if (!formData.reason) {
      newErrors.reason = 'Reason for amendment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      amendResultMutation.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-lg w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Amend Result</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Warning Message */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notice</p>
                  <p>
                    Amending a result will create a permanent record of the change. 
                    All amendments are tracked and cannot be deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Result Info */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Result</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Test:</span> {result.testName}</p>
                <p><span className="font-medium">Patient:</span> {result.patientName}</p>
                <p><span className="font-medium">Current Value:</span> {result.value} {result.unit}</p>
                <p><span className="font-medium">Status:</span> {result.status}</p>
              </div>
            </div>

            {/* Amendment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Value <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.newValue}
                    onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.newValue ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter new value"
                  />
                  {result.unit && (
                    <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                      {result.unit}
                    </span>
                  )}
                </div>
                {errors.newValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.newValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Amendment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select reason</option>
                  <option value="data_entry_error">Data Entry Error</option>
                  <option value="transcription_error">Transcription Error</option>
                  <option value="equipment_malfunction">Equipment Malfunction</option>
                  <option value="sample_mix_up">Sample Mix-up</option>
                  <option value="repeat_test">Repeat Test Result</option>
                  <option value="clinical_review">Clinical Review</option>
                  <option value="quality_control">Quality Control Issue</option>
                  <option value="other">Other</option>
                </select>
                {errors.reason && (
                  <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any additional notes or comments..."
                />
              </div>
            </div>

            {/* Amendment History */}
            {result.amendments && result.amendments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Amendment History
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {result.amendments.map((amendment: Amendment, index: number) => (
                    <div key={index} className="text-xs bg-gray-50 rounded p-2">
                      <p className="font-medium">
                        {new Date(amendment.timestamp).toLocaleString()}
                      </p>
                      <p>
                        Changed from {amendment.previousValue} to {amendment.newValue} by {amendment.amendedBy}
                      </p>
                      <p className="text-gray-600">Reason: {amendment.reason.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={amendResultMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {amendResultMutation.isPending ? 'Saving...' : 'Amend Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultAmendmentModal;