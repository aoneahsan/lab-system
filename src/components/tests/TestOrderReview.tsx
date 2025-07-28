import React, { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import type { TestOrder } from '@/types/test.types';

interface TestOrderReviewProps {
  order: TestOrder;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

const TestOrderReview: React.FC<TestOrderReviewProps> = ({
  order,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const handleApprove = async () => {
    await onApprove(approvalNotes);
    setApprovalNotes('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await onReject(rejectionReason);
    setRejectionReason('');
    setShowRejectDialog(false);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Review Required</h3>

          <div className="space-y-3 mb-4">
            <div className="bg-white rounded p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Priority:</span>
                <span
                  className={`font-medium ${
                    order.priority === 'stat'
                      ? 'text-red-600'
                      : order.priority === 'asap'
                        ? 'text-orange-600'
                        : 'text-gray-900'
                  }`}
                >
                  {order.priority.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tests Ordered:</span>
                <span className="font-medium">{order.tests.length}</span>
              </div>

              {order.clinicalHistory && (
                <div className="text-sm">
                  <span className="text-gray-600">Clinical History:</span>
                  <p className="mt-1 text-gray-900">{order.clinicalHistory}</p>
                </div>
              )}

              {order.diagnosis && (
                <div className="text-sm">
                  <span className="text-gray-600">Diagnosis:</span>
                  <p className="mt-1 text-gray-900">{order.diagnosis}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Approval Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Approve Order
            </button>

            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Reject Order
            </button>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Test Order</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Please provide a reason for rejection..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestOrderReview;
