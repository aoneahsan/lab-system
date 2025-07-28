import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing';
import type { InsuranceClaim } from '@/services/billing';
import { formatCurrency } from '@/utils/formatters';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const InsuranceClaims: React.FC = () => {
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  const { data: claims, isLoading } = useQuery({
    queryKey: ['insurance-claims', filters],
    queryFn: () => billingService.getInsuranceClaims(filters),
  });

  const getStatusIcon = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Insurance Claims</h1>
        <button
          onClick={() => setShowSubmitDialog(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <DocumentTextIcon className="h-4 w-4 mr-2" />
          New Claim
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <input
              type="text"
              value={filters.provider}
              onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
              placeholder="Insurance provider..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate.toISOString().split('T')[0]}
              onChange={(e) => setFilters({ ...filters, startDate: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate.toISOString().split('T')[0]}
              onChange={(e) => setFilters({ ...filters, endDate: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Claims Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-8 text-gray-500">Loading claims...</div>
        ) : claims?.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">No claims found</div>
        ) : (
          claims?.map((claim) => (
            <div
              key={claim.claimId}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(claim.status)}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Claim #{claim.claimNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{claim.provider}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    claim.status
                  )}`}
                >
                  {claim.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Claim Amount:</span>
                  <span className="font-medium">{formatCurrency(claim.claimAmount)}</span>
                </div>
                {claim.approvedAmount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Approved Amount:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(claim.approvedAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Policy Number:</span>
                  <span className="font-mono text-xs">{claim.policyNumber}</span>
                </div>
                {claim.submittedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Submitted:</span>
                    <span>{new Date(claim.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {claim.denialReason && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{claim.denialReason}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Claim Details - #{selectedClaim.claimNumber}
              </h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedClaim.status
                      )}`}
                    >
                      {selectedClaim.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClaim.provider}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                  <p className="mt-1 text-sm font-mono text-gray-900">
                    {selectedClaim.policyNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bill ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClaim.billId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Claim Amount</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedClaim.claimAmount)}
                  </p>
                </div>
                {selectedClaim.approvedAmount !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Approved Amount
                    </label>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      {formatCurrency(selectedClaim.approvedAmount)}
                    </p>
                  </div>
                )}
              </div>

              {selectedClaim.denialReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Denial Reason
                  </label>
                  <div className="p-3 bg-red-50 rounded text-sm text-red-700">
                    {selectedClaim.denialReason}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents</label>
                <div className="space-y-1">
                  {selectedClaim.documents.length === 0 ? (
                    <p className="text-sm text-gray-500">No documents attached</p>
                  ) : (
                    selectedClaim.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        <a href="#" className="underline">
                          {doc}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceClaims;
