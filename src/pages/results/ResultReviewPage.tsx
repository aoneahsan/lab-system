import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { COLLECTIONS } from '@/config/firebase-collections';
import { toast } from '@/stores/toast.store';
import type { TestResult } from '@/types/result.types';

interface ReviewResult extends TestResult {
  patientName: string;
  testName: string;
  enteredByName: string;
}

const ResultReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Fetch results pending review
  const { data: pendingResults = [], isLoading } = useQuery({
    queryKey: ['pendingReview', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      const resultsQuery = query(
        collection(firestore, COLLECTIONS.RESULTS),
        where('status', 'in', ['preliminary', 'pending_review']),
        where('enteredBy', '!=', user?.email)
      );

      const snapshot = await getDocs(resultsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        performedAt: doc.data().performedAt?.toDate() || new Date(),
      })) as ReviewResult[];
    },
    enabled: !!tenant && !!user,
  });

  // Approve results mutation
  const approveResultsMutation = useMutation({
    mutationFn: async (resultIds: string[]) => {
      if (!tenant || !user) throw new Error('Missing tenant or user');

      const updatePromises = resultIds.map(resultId =>
        updateDoc(doc(firestore, COLLECTIONS.RESULTS, resultId), {
          status: 'final',
          verifiedBy: user.displayName || user.email,
          verifiedAt: serverTimestamp(),
          reviewNotes: reviewNotes[resultId] || '',
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      toast.success('Results Approved', `${selectedResults.length} results have been approved`);
      queryClient.invalidateQueries({ queryKey: ['pendingReview'] });
      setSelectedResults([]);
      setReviewNotes({});
    },
    onError: (error) => {
      toast.error('Approval Failed', 'Failed to approve results');
      console.error('Approval error:', error);
    },
  });

  // Reject results mutation
  const rejectResultsMutation = useMutation({
    mutationFn: async (data: { resultIds: string[]; reason: string }) => {
      if (!tenant || !user) throw new Error('Missing tenant or user');

      const updatePromises = data.resultIds.map(resultId =>
        updateDoc(doc(firestore, COLLECTIONS.RESULTS, resultId), {
          status: 'rejected',
          rejectedBy: user.displayName || user.email,
          rejectedAt: serverTimestamp(),
          rejectionReason: data.reason,
          reviewNotes: reviewNotes[resultId] || '',
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      toast.success('Results Rejected', `${selectedResults.length} results have been rejected`);
      queryClient.invalidateQueries({ queryKey: ['pendingReview'] });
      setSelectedResults([]);
      setReviewNotes({});
    },
    onError: (error) => {
      toast.error('Rejection Failed', 'Failed to reject results');
      console.error('Rejection error:', error);
    },
  });

  const handleApprove = () => {
    if (selectedResults.length === 0) {
      toast.error('No Selection', 'Please select results to approve');
      return;
    }

    approveResultsMutation.mutate(selectedResults);
  };

  const handleReject = () => {
    if (selectedResults.length === 0) {
      toast.error('No Selection', 'Please select results to reject');
      return;
    }

    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectResultsMutation.mutate({ resultIds: selectedResults, reason });
    }
  };

  const toggleSelectAll = () => {
    if (selectedResults.length === pendingResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(pendingResults.map(r => r.id));
    }
  };

  const toggleSelect = (resultId: string) => {
    if (selectedResults.includes(resultId)) {
      setSelectedResults(selectedResults.filter(id => id !== resultId));
    } else {
      setSelectedResults([...selectedResults, resultId]);
    }
  };

  const updateReviewNote = (resultId: string, note: string) => {
    setReviewNotes({ ...reviewNotes, [resultId]: note });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'abnormal':
      case 'high':
      case 'low':
        return 'text-yellow-600';
      case 'critical_high':
      case 'critical_low':
        return 'text-red-600 font-bold';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/results')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Results</h1>
            <p className="text-gray-600 mt-2">Review and approve pending test results</p>
          </div>
          {selectedResults.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={approveResultsMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Approve ({selectedResults.length})
              </button>
              <button
                onClick={handleReject}
                disabled={rejectResultsMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject ({selectedResults.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Results Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading pending results...</p>
          </div>
        ) : pendingResults.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No results pending review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedResults.length === pendingResults.length}
                      onChange={toggleSelectAll}
                    />
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
                    Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entered By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingResults.map((result) => (
                  <tr key={result.id} className={`hover:bg-gray-50 ${selectedResults.includes(result.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedResults.includes(result.id)}
                        onChange={() => toggleSelect(result.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.patientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{result.testName}</div>
                        <div className="text-sm text-gray-500">{result.testCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.value} {result.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getStatusColor(result.flag)}`}>
                        {result.flag === 'critical_high' || result.flag === 'critical_low' ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {result.flag.replace('_', ' ').toUpperCase()}
                          </div>
                        ) : (
                          result.flag.replace('_', ' ').toUpperCase()
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        <div>{result.enteredByName || result.enteredBy}</div>
                        <div className="text-xs">{result.performedAt.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={reviewNotes[result.id] || ''}
                        onChange={(e) => updateReviewNote(result.id, e.target.value)}
                        placeholder="Add review notes..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultReviewPage;