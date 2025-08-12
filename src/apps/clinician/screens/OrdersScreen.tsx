import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';

export function OrdersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: orders = [], isLoading } = useOrders({
    clinicianId: 'current',
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const filteredOrders = orders.filter(
    (order) =>
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
    completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    critical: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Orders</h1>
        <Link to="/clinician/orders/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card
          className={`p-3 text-center cursor-pointer ${
            statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold">{orderStats.total}</p>
        </Card>
        <Card
          className={`p-3 text-center cursor-pointer ${
            statusFilter === 'pending' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setStatusFilter('pending')}
        >
          <p className="text-xs text-gray-600">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{orderStats.pending}</p>
        </Card>
        <Card
          className={`p-3 text-center cursor-pointer ${
            statusFilter === 'in_progress' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setStatusFilter('in_progress')}
        >
          <p className="text-xs text-gray-600">In Progress</p>
          <p className="text-lg font-bold text-blue-600">{orderStats.inProgress}</p>
        </Card>
        <Card
          className={`p-3 text-center cursor-pointer ${
            statusFilter === 'completed' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setStatusFilter('completed')}
        >
          <p className="text-xs text-gray-600">Completed</p>
          <p className="text-lg font-bold text-green-600">{orderStats.completed}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search orders by patient or order number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Loading orders...</p>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No orders found</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const status = statusColors[order.status as keyof typeof statusColors];
            const StatusIcon = status.icon;

            return (
              <Link key={order.id} to={`/clinician/orders/${order.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{order.patientName}</h3>
                        <Badge className={`${status.bg} ${status.text}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Order #{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {order.tests.length} test{order.tests.length > 1 ? 's' : ''} •{' '}
                        {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                      </p>
                      {order.priority === 'stat' && (
                        <Badge className="mt-2 bg-red-100 text-red-800">STAT</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
