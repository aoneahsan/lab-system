import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, FileText, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { COLLECTIONS } from '@/config/firebase-collections';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import type { TestResult } from '@/types/result.types';

interface ResultApprovalWorkflowProps {
  result: TestResult;
  onComplete?: () => void;
}

const ResultApprovalWorkflow: React.FC<ResultApprovalWorkflowProps> = ({ result, onComplete }) => {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [reviewNote, setReviewNote] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_review' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Workflow action mutation
  const workflowMutation = useMutation({
    mutationFn: async (action: 'approve' | 'reject' | 'request_review') => {
      if (!currentUser) throw new Error('User not authenticated');

      const updateData: any = {
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.displayName || currentUser.email,
      };

      switch (action) {
        case 'approve':
          updateData.status = 'final';
          updateData.verifiedBy = currentUser.displayName || currentUser.email;
          updateData.verifiedAt = serverTimestamp();
          updateData.reviewNote = reviewNote;
          break;
        case 'reject':
          updateData.status = 'rejected';
          updateData.rejectedBy = currentUser.displayName || currentUser.email;
          updateData.rejectedAt = serverTimestamp();
          updateData.rejectionReason = rejectionReason;
          updateData.reviewNote = reviewNote;
          break;
        case 'request_review':
          updateData.status = 'pending_review';
          updateData.reviewRequestedBy = currentUser.displayName || currentUser.email;
          updateData.reviewRequestedAt = serverTimestamp();
          updateData.reviewNote = reviewNote;
          break;
      }

      await updateDoc(doc(firestore, COLLECTIONS.RESULTS, result.id), updateData);
    },
    onSuccess: (_, action) => {
      const messages = {
        approve: 'Result approved successfully',
        reject: 'Result rejected',
        request_review: 'Review requested',
      };
      toast.success('Action Completed', messages[action]);
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReview'] });
      if (onComplete) onComplete();
    },
    onError: () => {
      toast.error('Action Failed', 'Failed to complete workflow action');
    },
  });

  const handleAction = () => {
    if (!selectedAction) return;
    
    if (selectedAction === 'reject' && !rejectionReason) {
      toast.error('Reason Required', 'Please provide a reason for rejection');
      return;
    }

    workflowMutation.mutate(selectedAction);
  };

  const getStatusDisplay = () => {
    switch (result.status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', label: 'Pending Entry' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-600', label: 'In Progress' };
      case 'preliminary':
        return { icon: FileText, color: 'text-purple-600', label: 'Preliminary' };
      case 'pending_review':
        return { icon: AlertCircle, color: 'text-orange-600', label: 'Pending Review' };
      case 'verified':
      case 'final':
        return { icon: CheckCircle, color: 'text-green-600', label: 'Final' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', label: 'Rejected' };
      default:
        return { icon: FileText, color: 'text-gray-600', label: result.status };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const isEditable = ['preliminary', 'pending_review'].includes(result.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Result Approval Workflow</h3>

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-6 w-6 ${statusDisplay.color}`} />
          <div>
            <p className="text-sm text-gray-500">Current Status</p>
            <p className={`font-medium ${statusDisplay.color}`}>{statusDisplay.label}</p>
          </div>
        </div>
      </div>

      {isEditable && (
        <>
          {/* Review Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Note (Optional)
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add any notes about this result review..."
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
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
                  <p className="font-medium text-gray-900">Approve Result</p>
                  <p className="text-sm text-gray-500">Mark as final and release to patient</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedAction('request_review')}
              className={`w-full px-4 py-3 text-left rounded-md border-2 transition-colors ${
                selectedAction === 'request_review'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Request Senior Review</p>
                  <p className="text-sm text-gray-500">Forward to senior staff for review</p>
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
                  <p className="font-medium text-gray-900">Reject Result</p>
                  <p className="text-sm text-gray-500">Mark as invalid and require re-entry</p>
                </div>
              </div>
            </button>
          </div>

          {/* Rejection Reason */}
          {selectedAction === 'reject' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                rows={2}
                placeholder="Provide reason for rejection..."
                required
              />
            </div>
          )}

          {/* Submit Button */}
          {selectedAction && (
            <div className="mt-6">
              <button
                onClick={handleAction}
                disabled={workflowMutation.isPending}
                className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md flex items-center justify-center gap-2 ${
                  selectedAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : selectedAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50`}
              >
                <Send className="h-4 w-4" />
                {workflowMutation.isPending ? 'Processing...' : 'Submit'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Read-only status info */}
      {!isEditable && (
        <div className="text-sm text-gray-500">
          {result.status === 'final' && result.verifiedBy && (
            <p>Approved by {result.verifiedBy} on {result.verifiedAt?.toDate?.().toLocaleDateString()}</p>
          )}
          {result.status === 'rejected' && result.rejectedBy && (
            <div>
              <p>Rejected by {result.rejectedBy} on {result.rejectedAt?.toDate?.().toLocaleDateString()}</p>
              {result.rejectionReason && (
                <p className="mt-1 text-red-600">Reason: {result.rejectionReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultApprovalWorkflow;