import React, { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { COLLECTIONS } from '@/config/firebase-collections';
import { toast } from '@/stores/toast.store';
import { resultValidationService } from '@/services/result-validation.service';
import type { TestResult } from '@/types/result.types';
import type { Test } from '@/types/test.types';

interface ResultCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult;
  test: Test;
}

const ResultCorrectionModal: React.FC<ResultCorrectionModalProps> = ({
  isOpen,
  onClose,
  result,
  test,
}) => {
  const { currentUser } = useAuthStore();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    value: '',
    notes: '',
  });

  // Reset form data when modal opens with result data
  useEffect(() => {
    if (isOpen && result) {
      setFormData({
        value: result.value,
        notes: result.comments || '',
      });
    }
  }, [isOpen, result]);

  const [validationResult, setValidationResult] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const correctResultMutation = useMutation({
    mutationFn: async () => {
      if (!tenant || !currentUser) throw new Error('Missing tenant or user');

      // Validate the new value
      const validation = await resultValidationService.validateResult(
        test.id,
        formData.value,
        result.patientId,
        test.referenceRanges?.[0]
          ? {
              min: test.referenceRanges[0].normalMin,
              max: test.referenceRanges[0].normalMax,
            }
          : undefined
      );

      if (!validation.isValid && validation.errors.length > 0) {
        throw new Error(validation.errors.join(', '));
      }

      await updateDoc(doc(firestore, COLLECTIONS.RESULTS, result.id), {
        value: formData.value,
        notes: formData.notes,
        flag: validation.flags[0] || 'normal',
        status: validation.requiresReview ? 'pending_review' : result.status,
        correctedAt: serverTimestamp(),
        correctedBy: currentUser.displayName || currentUser.email,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      toast.success('Result Corrected', 'The test result has been successfully corrected');
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['result', result.id] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error('Correction Failed', error.message);
    },
  });

  const handleValueChange = async (value: string) => {
    setFormData({ ...formData, value });

    // Validate the value
    if (value && test) {
      try {
        const validation = await resultValidationService.validateResult(
          test.id,
          value,
          result.patientId,
          test.referenceRanges?.[0]
            ? {
                min: test.referenceRanges[0].normalMin,
                max: test.referenceRanges[0].normalMax,
              }
            : undefined
        );
        setValidationResult(validation);
      } catch (error) {
        console.error('Validation error:', error);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.value) {
      newErrors.value = 'Value is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      correctResultMutation.mutate();
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
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Correct Result
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Current Result Info */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Result Information</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Test:</span> {test.name} ({test.code})
                </p>
                <p>
                  <span className="font-medium">Patient ID:</span> {result.patientId}
                </p>
                <p>
                  <span className="font-medium">Sample ID:</span> {result.sampleId}
                </p>
                <p>
                  <span className="font-medium">Current Status:</span> {result.status}
                </p>
              </div>
            </div>

            {/* Correction Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result Value <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.value ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter result value"
                  />
                  {test.unit && (
                    <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                      {test.unit}
                    </span>
                  )}
                </div>
                {errors.value && <p className="text-sm text-red-600 mt-1">{errors.value}</p>}

                {/* Reference Range */}
                {test.referenceRanges?.[0] && (
                  <p className="text-xs text-gray-600 mt-1">
                    Reference:{' '}
                    {test.referenceRanges[0].textRange ||
                      (test.referenceRanges[0].normalMin !== undefined &&
                      test.referenceRanges[0].normalMax !== undefined
                        ? `${test.referenceRanges[0].normalMin} - ${
                            test.referenceRanges[0].normalMax
                          }${test.unit ? ` ${test.unit}` : ''}`
                        : 'Not specified')}
                  </p>
                )}
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div
                  className={`rounded-lg p-3 ${
                    validationResult.isCritical
                      ? 'bg-red-50 border border-red-200'
                      : validationResult.warnings.length > 0
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-green-50 border border-green-200'
                  }`}
                >
                  {validationResult.isCritical && (
                    <p className="text-sm font-medium text-red-800 mb-1">Critical Value!</p>
                  )}
                  {validationResult.warnings.map((warning: string, index: number) => (
                    <p key={index} className="text-sm text-yellow-800">
                      {warning}
                    </p>
                  ))}
                  {validationResult.errors.map((error: string, index: number) => (
                    <p key={index} className="text-sm text-red-800">
                      {error}
                    </p>
                  ))}
                  {!validationResult.isCritical &&
                    validationResult.warnings.length === 0 &&
                    validationResult.errors.length === 0 && (
                      <p className="text-sm text-green-800">Value is within normal range</p>
                    )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any notes or comments..."
                />
              </div>
            </div>

            {/* Correction vs Amendment Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Corrections can only be made to results that haven't been
                finalized. For finalized results, use the Amendment feature instead.
              </p>
            </div>
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
              disabled={correctResultMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {correctResultMutation.isPending ? 'Saving...' : 'Save Correction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCorrectionModal;
