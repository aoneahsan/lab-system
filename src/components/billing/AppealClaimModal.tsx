import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppealClaim } from '@/hooks/useBilling';
import type { InsuranceClaim } from '@/types/billing.types';

interface AppealClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: InsuranceClaim;
}

const AppealClaimModal: React.FC<AppealClaimModalProps> = ({ isOpen, onClose, claim }) => {
  const [appealReason, setAppealReason] = useState('');
  const [additionalDocuments, setAdditionalDocuments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appealClaimMutation = useAppealClaim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appealReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await appealClaimMutation.mutateAsync({
        claimId: claim.id,
        appealReason,
        additionalDocuments,
      });
      onClose();
    } catch (error) {
      console.error('Error appealing claim:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Appeal Insurance Claim</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Claim Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Claim Information</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-500">Claim Number:</dt>
                  <dd className="font-medium">{claim.claimNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Total Charges:</dt>
                  <dd className="font-medium">${claim.totalCharges.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Paid Amount:</dt>
                  <dd className="font-medium">
                    ${claim.paidAmount?.toFixed(2) || '0.00'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Insurance Provider:</dt>
                  <dd className="font-medium">{claim.insuranceId}</dd>
                </div>
              </dl>
              {claim.denialReason && (
                <div className="mt-3 pt-3 border-t">
                  <dt className="text-sm text-gray-500">Denial Reason:</dt>
                  <dd className="text-sm mt-1">{claim.denialReason}</dd>
                </div>
              )}
            </div>

            {/* Appeal Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appeal Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide a detailed explanation for the appeal..."
                required
              />
            </div>

            {/* Additional Documents */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Documentation
              </label>
              <textarea
                value={additionalDocuments}
                onChange={(e) => setAdditionalDocuments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List any additional documents or information to support the appeal..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                disabled={isSubmitting || !appealReason.trim()}
              >
                {isSubmitting ? 'Submitting Appeal...' : 'Submit Appeal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppealClaimModal;