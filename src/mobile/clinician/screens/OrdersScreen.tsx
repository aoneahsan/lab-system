import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  ChevronRight,
  Send,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface TestOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  patientMRN: string;
  tests: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  orderedDate: Date;
  completedDate?: Date;
  resultCount?: number;
  criticalCount?: number;
}

export const OrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [orders] = useState<TestOrder[]>([
    {
      id: '1',
      orderNumber: 'ORD-2024-0142',
      patientName: 'Emma Wilson',
      patientMRN: 'MRN001234',
      tests: ['CBC', 'CMP', 'Lipid Panel'],
      status: 'pending',
      priority: 'stat',
      orderedDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-0141',
      patientName: 'James Chen',
      patientMRN: 'MRN001235',
      tests: ['HbA1c', 'Glucose', 'Insulin'],
      status: 'in-progress',
      priority: 'routine',
      orderedDate: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-0140',
      patientName: 'Sarah Johnson',
      patientMRN: 'MRN001236',
      tests: ['TSH', 'Free T4', 'Free T3'],
      status: 'completed',
      priority: 'routine',
      orderedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      resultCount: 3,
      criticalCount: 1
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-0139',
      patientName: 'Michael Brown',
      patientMRN: 'MRN001237',
      tests: ['Troponin I', 'BNP', 'D-Dimer'],
      status: 'pending',
      priority: 'urgent',
      orderedDate: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patientMRN.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'text-red-600 font-semibold';
      case 'urgent':
        return 'text-yellow-600 font-semibold';
      default:
        return 'text-gray-600';
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
    setShowBulkActions(true);
  };

  const handleBulkCancel = () => {
    console.log('Cancelling orders:', selectedOrders);
    setSelectedOrders([]);
    setShowBulkActions(false);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Test Orders</h1>
            <button
              onClick={() => navigate('/clinician/new-order')}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  filterStatus === filter.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="p-4 space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div
              onClick={() => navigate(`/clinician/order/${order.id}`)}
              className="p-4 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.patientName} • {order.patientMRN}</p>
                  </div>
                </div>
                <span className={`text-xs uppercase ${getPriorityColor(order.priority)}`}>
                  {order.priority}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {order.tests.map((test, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {test}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {format(order.orderedDate, 'MMM d, h:mm a')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {order.status === 'completed' && order.resultCount && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      {order.resultCount} results available
                    </span>
                    {order.criticalCount && order.criticalCount > 0 && (
                      <span className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {order.criticalCount} critical
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {order.status === 'pending' && (
              <div className="px-4 pb-4 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clinician/order/${order.id}/edit`);
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  Edit Order
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOrderSelection(order.id);
                  }}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            )}

            {order.status === 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/clinician/order/${order.id}/results`);
                }}
                className="w-full px-4 pb-4"
              >
                <div className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>View Results</span>
                </div>
              </button>
            )}
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search' : 'Create a new order to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedOrders.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedOrders([]);
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
              >
                Cancel Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/clinician/new-order')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};