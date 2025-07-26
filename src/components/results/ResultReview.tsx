import { useState, useEffect } from 'react';
import { Check, AlertCircle, History, User } from 'lucide-react';
import { useResultStore } from '@/stores/result.store';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

interface ResultReviewProps {
  orderId?: string;
  patientId?: string;
}

export default function ResultReview({ orderId, patientId }: ResultReviewProps) {
  const { currentUser } = useAuthStore();
  const { results, fetchResultsByOrder, fetchResultsByPatient, verifyResult, loading } = useResultStore();
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'entered' | 'verified'>('entered');

  useEffect(() => {
    if (!currentUser?.tenantId) return;
    
    if (orderId) {
      fetchResultsByOrder(currentUser.tenantId, orderId);
    } else if (patientId) {
      fetchResultsByPatient(currentUser.tenantId, patientId);
    }
  }, [currentUser, orderId, patientId]);

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const handleSelectAll = () => {
    if (selectedResults.size === filteredResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(filteredResults.map(r => r.id)));
    }
  };

  const handleVerifySelected = async () => {
    if (!currentUser?.tenantId || !currentUser?.id) return;

    for (const resultId of selectedResults) {
      await verifyResult(currentUser.tenantId, currentUser.id, resultId);
    }
    
    setSelectedResults(new Set());
    
    // Refresh results
    if (orderId) {
      await fetchResultsByOrder(currentUser.tenantId, orderId);
    } else if (patientId) {
      await fetchResultsByPatient(currentUser.tenantId, patientId);
    }
  };

  const getFlagColor = (flag?: string) => {
    switch (flag) {
      case 'H':
      case 'HH':
        return 'text-red-600 bg-red-50';
      case 'L':
      case 'LL':
        return 'text-blue-600 bg-blue-50';
      case 'A':
      case 'AA':
        return 'text-orange-600 bg-orange-50';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Result Review</h3>
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input py-1"
            >
              <option value="all">All Results</option>
              <option value="pending">Pending</option>
              <option value="entered">Entered</option>
              <option value="verified">Verified</option>
            </select>
            
            {selectedResults.size > 0 && (
              <button
                onClick={handleVerifySelected}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                <Check className="h-4 w-4" />
                Verify Selected ({selectedResults.size})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Test Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Entered By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading results...
                </td>
              </tr>
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No results found
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedResults);
                        if (e.target.checked) {
                          newSelected.add(result.id);
                        } else {
                          newSelected.delete(result.id);
                        }
                        setSelectedResults(newSelected);
                      }}
                      disabled={result.status === 'verified'}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {result.testName}
                    {result.category && (
                      <span className="text-xs text-gray-500 block">{result.category}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">{result.value}</span>
                      {result.unit && <span className="text-gray-500">{result.unit}</span>}
                      {result.flag && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getFlagColor(result.flag)}`}>
                          {result.flag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.referenceRange?.normal || 
                     (result.referenceRange?.min && result.referenceRange?.max
                       ? `${result.referenceRange.min} - ${result.referenceRange.max}`
                       : '-')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.status === 'verified' 
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'entered'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {result.enteredBy}
                    </div>
                    <div className="text-xs">
                      {format(result.enteredAt.toDate(), 'MMM d, h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {result.status !== 'verified' && (
                        <button
                          onClick={() => {
                            if (currentUser?.tenantId && currentUser?.id) {
                              verifyResult(currentUser.tenantId, currentUser.id, result.id);
                            }
                          }}
                          className="text-green-600 hover:text-green-700"
                          title="Verify Result"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {result.comments && (
                        <AlertCircle className="h-4 w-4 text-yellow-600" title={result.comments} />
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-700"
                        title="View History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}