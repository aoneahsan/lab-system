import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { COLLECTIONS } from '@/config/firebase-collections';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import type { TestResult } from '@/types/result.types';

interface BatchResultApprovalProps {
  results: TestResult[];
  onComplete?: () => void;
  onCancel?: () => void;
}

const BatchResultApproval: React.FC<BatchResultApprovalProps> = ({ results, onComplete, onCancel }) => {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [approvalNote, setApprovalNote] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter only eligible results (preliminary or pending_review)
  const eligibleResults = results.filter(r => ['preliminary', 'pending_review'].includes(r.status));

  const batchApprovalMutation = useMutation({
    mutationFn: async (action: 'approve' | 'reject') => {
      if (!currentUser) throw new Error('User not authenticated');

      const batch = writeBatch(firestore);
      const timestamp = serverTimestamp();
      const userName = currentUser.displayName || currentUser.email;

      eligibleResults.forEach((result) => {
        const resultRef = doc(firestore, COLLECTIONS.RESULTS, result.id);
        const updateData: any = {
          updatedAt: timestamp,
          updatedBy: userName,
        };

        if (action === 'approve') {
          updateData.status = 'final';
          updateData.verifiedBy = userName;
          updateData.verifiedAt = timestamp;
          updateData.reviewNote = approvalNote;
        } else {
          updateData.status = 'rejected';
          updateData.rejectedBy = userName;
          updateData.rejectedAt = timestamp;
          updateData.rejectionReason = rejectionReason;
          updateData.reviewNote = approvalNote;
        }

        batch.update(resultRef, updateData);
      });

      await batch.commit();
    },
    onSuccess: (_, action) => {
      const message = action === 'approve' 
        ? `${eligibleResults.length} results approved successfully`
        : `${eligibleResults.length} results rejected`;
      toast.success('Batch Action Completed', message);
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReview'] });
      if (onComplete) onComplete();
    },
    onError: () => {
      toast.error('Batch Action Failed', 'Failed to process batch approval');
    },
  });

  const handleAction = () => {
    if (!selectedAction) return;
    
    if (selectedAction === 'reject' && !rejectionReason) {
      toast.error('Reason Required', 'Please provide a reason for rejection');
      return;
    }

    batchApprovalMutation.mutate(selectedAction);
  };

  if (eligibleResults.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800">No results eligible for batch approval. Only preliminary and pending review results can be approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Batch Result Approval</h3>

      {/* Summary */}
      <div className="mb-6 bg-blue-50 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <strong>{eligibleResults.length}</strong> results selected for batch approval
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {results.length - eligibleResults.length > 0 && 
            `(${results.length - eligibleResults.length} results skipped - already final or rejected)`
          }
        </p>
      </div>

      {/* Review Note */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Note (Optional)
        </label>
        <textarea
          value={approvalNote}
          onChange={(e) => setApprovalNote(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Add any notes about this batch review..."
        />
      </div>

      {/* Action Selection */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setSelectedAction('approve')}
          className={`w-full px-4 py-3 text-left rounded-md border-2 transition-colors ${
            selectedAction === 'approve'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Approve All</p>
              <p className="text-sm text-gray-500">Mark all selected results as final</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedAction('reject')}
          className={`w-full px-4 py-3 text-left rounded-md border-2 transition-colors ${
            selectedAction === 'reject'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Reject All</p>
              <p className="text-sm text-gray-500">Mark all selected results as invalid</p>
            </div>
          </div>
        </button>
      </div>

      {/* Rejection Reason */}
      {selectedAction === 'reject' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            rows={2}
            placeholder="Provide reason for batch rejection..."
            required
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        {selectedAction && (
          <button
            onClick={handleAction}
            disabled={batchApprovalMutation.isPending}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md flex items-center justify-center gap-2 ${
              selectedAction === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            <Send className="h-4 w-4" />
            {batchApprovalMutation.isPending ? 'Processing...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BatchResultApproval;