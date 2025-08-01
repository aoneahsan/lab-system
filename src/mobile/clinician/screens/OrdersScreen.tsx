import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Calendar,
  ChevronRight,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  patientName: string;
  patientMrn: string;
  orderDate: string;
  tests: string[];
  priority: 'stat' | 'urgent' | 'routine';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  provider: string;
  notes?: string;
}

export const OrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const orders: Order[] = [
    {
      id: 'ORD001',
      patientName: 'John Doe',
      patientMrn: 'MRN123456',
      orderDate: '2024-10-27T10:00:00',
      tests: ['CBC', 'Lipid Panel', 'HbA1c'],
      priority: 'stat',
      status: 'pending',
      provider: 'Dr. Smith',
      notes: 'Patient fasting for 12 hours',
    },
    {
      id: 'ORD002',
      patientName: 'Jane Smith',
      patientMrn: 'MRN123457',
      orderDate: '2024-10-27T09:30:00',
      tests: ['TSH', 'Free T4'],
      priority: 'routine',
      status: 'in_progress',
      provider: 'Dr. Smith',
    },
    {
      id: 'ORD003',
      patientName: 'Bob Johnson',
      patientMrn: 'MRN123458',
      orderDate: '2024-10-26T14:00:00',
      tests: ['Blood Culture x2', 'CBC with Diff'],
      priority: 'urgent',
      status: 'completed',
      provider: 'Dr. Smith',
    },
    {
      id: 'ORD004',
      patientName: 'Mary Wilson',
      patientMrn: 'MRN123459',
      orderDate: '2024-10-26T11:00:00',
      tests: ['Basic Metabolic Panel', 'Urinalysis'],
      priority: 'routine',
      status: 'completed',
      provider: 'Dr. Smith',
    },
  ];

  const filteredOrders = orders.filter(order => 
    activeTab === 'active' 
      ? ['pending', 'in_progress'].includes(order.status)
      : ['completed', 'cancelled'].includes(order.status)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Lab Orders</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your patient lab orders
              </p>
            </div>
            <button
              onClick={() => navigate('/clinician/orders/new')}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Active Orders ({orders.filter(o => ['pending', 'in_progress'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Completed ({orders.filter(o => ['completed', 'cancelled'].includes(o.status)).length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            onClick={() => navigate(`/clinician/order/${order.id}`)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{order.patientName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(order.priority)}`}>
                      {order.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{order.patientMrn} • Order #{order.id}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(order.orderDate), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                </div>
                {getStatusIcon(order.status)}
              </div>

              {/* Tests */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Tests Ordered:</p>
                <div className="flex flex-wrap gap-1">
                  {order.tests.map((test, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="p-2 bg-yellow-50 rounded-lg flex items-start gap-2">
                  <FileText className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{order.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-500">
                  Ordered by: {order.provider}
                </p>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {activeTab === 'active' && order.status === 'pending' && (
              <div className="bg-gray-50 px-4 py-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit order
                  }}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  Edit Order
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle cancel order
                  }}
                  className="flex-1 btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="p-8 text-center">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            No {activeTab} orders
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === 'active' 
              ? 'Create a new order to get started'
              : 'Completed orders will appear here'
            }
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => navigate('/clinician/orders/new')}
              className="mt-4 btn btn-primary btn-sm"
            >
              Create New Order
            </button>
          )}
        </div>
      )}
    </div>
  );
};