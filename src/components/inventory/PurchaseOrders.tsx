import { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal';
import type { PurchaseOrder, Vendor } from '@/types/inventory.types';

export default function PurchaseOrders() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const { purchaseOrders, vendors, fetchPurchaseOrders, fetchVendors } = useInventoryStore();

  useEffect(() => {
    fetchPurchaseOrders({ status: filterStatus === 'all' ? undefined : filterStatus });
    fetchVendors();
  }, [filterStatus, fetchPurchaseOrders, fetchVendors]);

  const getStatusIcon = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ordered':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'partial_received':
        return <Clock className="h-4 w-4 text-purple-500" />;
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'partial_received':
        return 'bg-purple-100 text-purple-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Purchase Orders</h2>
        <button onClick={() => setShowCreateOrder(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">All Orders</option>
            <option value="draft">Draft</option>
            <option value="submitted">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.map((order) => {
              const vendor = vendors.find((v: Vendor) => v.id === order.vendor.id);
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vendor?.name || 'Unknown Supplier'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    {order.status === 'draft' && (
                      <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {purchaseOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">No purchase orders found</div>
        )}
      </div>

      <CreatePurchaseOrderModal 
        isOpen={showCreateOrder} 
        onClose={() => setShowCreateOrder(false)} 
      />
    </div>
  );
}
