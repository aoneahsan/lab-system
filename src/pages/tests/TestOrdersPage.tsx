import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTestOrders, useCreateTestOrder, useUpdateTestOrderStatus } from '@/hooks/useTests';
import TestOrderForm from '@/components/tests/TestOrderForm';
import QuickTestOrder from '@/components/tests/QuickTestOrder';
import { useTenant } from '@/hooks/useTenant';
import { modalService } from '@/services/modal.service';
import type { TestOrder, TestOrderFormData, TestOrderFilter } from '@/types/test.types';

const TestOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<TestOrderFilter>({});
  const { tenant } = useTenant();

  const { data: orders = [], isLoading, error } = useTestOrders(filter);
  const createOrderMutation = useCreateTestOrder();
  const updateStatusMutation = useUpdateTestOrderStatus();

  // Check URL params on mount
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setShowAddForm(true);
      // Remove the action param after opening the form
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleCreateOrder = async (data: TestOrderFormData) => {
    await createOrderMutation.mutateAsync(data);
    setShowAddForm(false);
  };

  const handleStatusChange = async (order: TestOrder, newStatus: TestOrder['status']) => {
    let cancelReason;
    if (newStatus === 'cancelled') {
      cancelReason = await modalService.prompt({
        title: 'Cancellation Reason',
        message: 'Please provide a reason for cancellation:',
        placeholder: 'Enter cancellation reason...',
        required: true
      });
      if (!cancelReason) return;
    }

    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      status: newStatus,
      cancelReason,
    });
  };

  const getStatusIcon = (status: TestOrder['status']) => {
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

  const getStatusColor = (status: TestOrder['status']) => {
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

  const getPriorityColor = (priority: TestOrder['priority']) => {
    switch (priority) {
      case 'routine':
        return 'bg-gray-100 text-gray-800';
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'asap':
        return 'bg-orange-100 text-orange-800';
    }
  };

  if (showAddForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Test Order</h1>
          <p className="text-gray-600 mt-2">Order laboratory tests for a patient</p>
        </div>

        <TestOrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setShowAddForm(false)}
          isLoading={createOrderMutation.isPending}
        />
      </div>
    );
  }

  // Show error state if no tenant
  if (!tenant) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">No tenant selected. Please select a tenant to view test orders.</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading test orders: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Orders</h1>
            <p className="text-gray-600 mt-2">Manage laboratory test orders</p>
          </div>
          <div className="flex items-center gap-3">
            <QuickTestOrder />
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="specimen_collected">Specimen Collected</option>
            <option value="in_progress">In Progress</option>
            <option value="resulted">Resulted</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="routine">Routine</option>
            <option value="stat">STAT</option>
            <option value="asap">ASAP</option>
          </select>

          <button
            onClick={() => setFilter({})}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No test orders found.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create First Order
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/tests/orders/${order.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Patient ID: {order.patientId.slice(-6)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {order.tests.slice(0, 3).map((test, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800"
                        >
                          {test.testCode}
                        </span>
                      ))}
                      {order.tests.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{order.tests.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        order.priority
                      )}`}
                    >
                      {order.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(order.orderDate instanceof Date
                      ? order.orderDate
                      : order.orderDate.toDate()
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'awaiting_approval' ? (
                      <button
                        onClick={() => navigate(`/tests/orders/${order.id}`)}
                        className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Review Required
                      </button>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value as TestOrder['status'])
                        }
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={
                          order.status === 'cancelled' ||
                          order.status === 'resulted' ||
                          order.status === 'rejected'
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="specimen_collected">Specimen Collected</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resulted">Resulted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestOrdersPage;
