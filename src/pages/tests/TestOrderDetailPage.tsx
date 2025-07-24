import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTestOrder, useApproveTestOrder, useRejectTestOrder } from '@/hooks/useTests';
import { usePatient } from '@/hooks/usePatients';
import TestOrderReview from '@/components/tests/TestOrderReview';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

const TestOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const { data: order, isLoading: orderLoading, error: orderError } = useTestOrder(orderId!);
  const { data: patient, isLoading: patientLoading } = usePatient(order?.patientId || '');
  
  const approveOrderMutation = useApproveTestOrder();
  const rejectOrderMutation = useRejectTestOrder();

  const handleApprove = async (notes?: string) => {
    if (!orderId) return;
    await approveOrderMutation.mutateAsync({ orderId, notes });
  };

  const handleReject = async (reason: string) => {
    if (!orderId) return;
    await rejectOrderMutation.mutateAsync({ orderId, reason });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'awaiting_approval':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'specimen_collected':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-purple-500 animate-pulse" />;
      case 'resulted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_approval':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'specimen_collected':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'resulted':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'routine':
        return 'bg-gray-100 text-gray-800';
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'asap':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (orderLoading || patientLoading) {
    return <LoadingState message="Loading order details..." />;
  }

  if (orderError || !order) {
    return <ErrorState message="Failed to load order details" onRetry={() => navigate('/tests/orders')} />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/tests/orders')}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                {order.priority.toUpperCase()} PRIORITY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Show review component if order requires approval */}
      {order.status === 'awaiting_approval' && (
        <div className="mb-6">
          <TestOrderReview
            order={order}
            onApprove={handleApprove}
            onReject={handleReject}
            isLoading={approveOrderMutation.isPending || rejectOrderMutation.isPending}
          />
        </div>
      )}

      {/* Order Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            {patient ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">MRN</p>
                  <p className="font-medium">{patient.mrn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium capitalize">{patient.gender}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Patient information not available</p>
            )}
          </div>

          {/* Ordered Tests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordered Tests</h2>
            <div className="space-y-3">
              {order.tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{test.testName}</p>
                    <p className="text-sm text-gray-600">Code: {test.testCode}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    test.status === 'completed' ? 'bg-green-100 text-green-800' :
                    test.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    test.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    test.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {test.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Information */}
          {(order.clinicalHistory || order.diagnosis || order.icdCodes?.length) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Information</h2>
              <div className="space-y-4">
                {order.clinicalHistory && (
                  <div>
                    <p className="text-sm text-gray-600">Clinical History</p>
                    <p className="mt-1">{order.clinicalHistory}</p>
                  </div>
                )}
                {order.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-600">Diagnosis</p>
                    <p className="mt-1">{order.diagnosis}</p>
                  </div>
                )}
                {order.icdCodes && order.icdCodes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">ICD Codes</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {order.icdCodes.map((code, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.orderDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ordering Provider</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {order.orderingProviderName}
                </p>
              </div>
              {order.fasting && (
                <div>
                  <p className="text-sm text-gray-600">Special Requirements</p>
                  <p className="font-medium">Fasting Required</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          {(order.approvedAt || order.rejectedAt || order.cancelReason) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-3">
                {order.approvedAt && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.approvedAt).toLocaleString()}
                    </p>
                    {order.approvedBy && (
                      <p className="text-xs text-gray-600">By: {order.approvedBy}</p>
                    )}
                  </div>
                )}
                {order.rejectedAt && (
                  <div className="border-l-4 border-red-500 pl-4">
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.rejectedAt).toLocaleString()}
                    </p>
                    {order.rejectedBy && (
                      <p className="text-xs text-gray-600">By: {order.rejectedBy}</p>
                    )}
                    {order.rejectionReason && (
                      <p className="text-xs mt-1">Reason: {order.rejectionReason}</p>
                    )}
                  </div>
                )}
                {order.cancelReason && (
                  <div className="border-l-4 border-gray-500 pl-4">
                    <p className="text-sm font-medium">Cancelled</p>
                    <p className="text-xs">Reason: {order.cancelReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestOrderDetailPage;