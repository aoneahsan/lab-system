import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useClaim, useSubmitClaim } from '@/hooks/useBilling';
import AppealClaimModal from '@/components/billing/AppealClaimModal';

const ClaimDetailPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const [showAppealModal, setShowAppealModal] = useState(false);

  const { data: claim, isLoading } = useClaim(claimId!);
  const submitClaimMutation = useSubmitClaim();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Claim not found.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      appealing: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5" />;
      case 'submitted':
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'accepted':
      case 'paid':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      case 'appealing':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleSubmitClaim = async () => {
    try {
      await submitClaimMutation.mutateAsync(claimId!);
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/billing/claims')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Claims
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Claim #{claim.claimNumber}</h1>
            <p className="text-gray-600 mt-2">Invoice #{claim.invoiceNumber}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${getStatusColor(
                claim.status
              )}`}
            >
              {getStatusIcon(claim.status)}
              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
            </span>

            {claim.status === 'draft' && (
              <button
                onClick={handleSubmitClaim}
                disabled={submitClaimMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Submit Claim
              </button>
            )}

            {claim.status === 'rejected' && (
              <button
                onClick={() => setShowAppealModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Appeal
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Claim Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Claim Date</dt>
                <dd className="text-sm font-medium">
                  {claim.claimDate.toDate().toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Service Date</dt>
                <dd className="text-sm font-medium">
                  {claim.serviceDate.toDate().toLocaleDateString()}
                </dd>
              </div>
              {claim.submittedDate && (
                <div>
                  <dt className="text-sm text-gray-500">Submitted Date</dt>
                  <dd className="text-sm font-medium">
                    {claim.submittedDate.toDate().toLocaleDateString()}
                  </dd>
                </div>
              )}
              {claim.processedDate && (
                <div>
                  <dt className="text-sm text-gray-500">Processed Date</dt>
                  <dd className="text-sm font-medium">
                    {claim.processedDate.toDate().toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Services */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Services</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CPT Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Units
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Charge
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {claim.services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-4 py-3 text-sm">{service.cptCode}</td>
                      <td className="px-4 py-3 text-sm">{service.description}</td>
                      <td className="px-4 py-3 text-sm text-right">{service.units}</td>
                      <td className="px-4 py-3 text-sm text-right">${service.charge.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ${(service.units * service.charge).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">
                      Total Charges:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right">
                      ${claim.totalCharges.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Diagnosis Codes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Diagnosis Codes</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Primary Diagnosis</h3>
                <p className="text-sm text-gray-900">{claim.primaryDiagnosis}</p>
              </div>
              {claim.secondaryDiagnoses && claim.secondaryDiagnoses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Secondary Diagnoses</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {claim.secondaryDiagnoses.map((dx, index) => (
                      <li key={index} className="text-sm text-gray-900">
                        {dx}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Charges</dt>
                <dd className="text-sm font-medium">${claim.totalCharges.toFixed(2)}</dd>
              </div>
              {claim.approvedAmount && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Approved Amount</dt>
                  <dd className="text-sm font-medium text-green-600">
                    ${claim.approvedAmount.toFixed(2)}
                  </dd>
                </div>
              )}
              {claim.deniedAmount && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Denied Amount</dt>
                  <dd className="text-sm font-medium text-red-600">
                    ${claim.deniedAmount.toFixed(2)}
                  </dd>
                </div>
              )}
              {claim.paidAmount && (
                <div className="flex justify-between pt-3 border-t">
                  <dt className="text-sm font-medium">Paid Amount</dt>
                  <dd className="text-sm font-bold text-green-600">
                    ${claim.paidAmount.toFixed(2)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Provider Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Provider Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Rendering Provider</dt>
                <dd className="text-sm font-medium">
                  {claim.renderingProvider || 'Not specified'}
                </dd>
              </div>
              {claim.npiNumber && (
                <div>
                  <dt className="text-sm text-gray-500">NPI Number</dt>
                  <dd className="text-sm font-medium">{claim.npiNumber}</dd>
                </div>
              )}
              {claim.taxId && (
                <div>
                  <dt className="text-sm text-gray-500">Tax ID</dt>
                  <dd className="text-sm font-medium">{claim.taxId}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          {claim.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-sm text-gray-700">{claim.notes}</p>
            </div>
          )}

          {/* Rejection Reason */}
          {claim.rejectionReason && (
            <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
              <h2 className="text-lg font-semibold mb-2 text-red-800">Rejection Reason</h2>
              <p className="text-sm text-red-700">{claim.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Modal */}
      {showAppealModal && claim && (
        <AppealClaimModal
          isOpen={showAppealModal}
          onClose={() => setShowAppealModal(false)}
          claim={claim}
        />
      )}
    </div>
  );
};

export default ClaimDetailPage;
