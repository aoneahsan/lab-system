import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Printer,
  X,
} from 'lucide-react';
import { useOrder } from '@/hooks/useOrder';
import { format } from 'date-fns';
import { useCancelOrder } from '@/hooks/useCancelOrder';
import { toast } from 'sonner';

export function OrderDetailScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId!);
  const { mutate: cancelOrder } = useCancelOrder();

  const handleCancelOrder = () => {
    if (!order || order.status !== 'pending') return;

    if (confirm('Are you sure you want to cancel this order?')) {
      cancelOrder(orderId!, {
        onSuccess: () => {
          toast.success('Order cancelled successfully');
          navigate('/clinician/orders');
        },
        onError: () => {
          toast.error('Failed to cancel order');
        },
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !order) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading order details...</p>
        </Card>
      </div>
    );
  }

  const statusColors = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
    completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: X },
  };

  const status = statusColors[order.status as keyof typeof statusColors];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clinician/orders')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          {order.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOrder}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Created {format(new Date(order.createdAt), 'PPpp')}
            </p>
          </div>
          <Badge className={`${status.bg} ${status.text}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {order.status.replace('_', ' ')}
          </Badge>
        </div>

        {order.priority === 'stat' && (
          <Badge className="mb-4 bg-red-100 text-red-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            STAT Priority
          </Badge>
        )}

        {/* Patient Info */}
        <div className="border-t pt-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium">{order.patientName}</p>
            </div>
            <div>
              <p className="text-gray-600">MRN</p>
              <p className="font-medium">{order.patientMRN}</p>
            </div>
            <div>
              <p className="text-gray-600">DOB</p>
              <p className="font-medium">{format(new Date(order.patientDOB), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-gray-600">Age</p>
              <p className="font-medium">{order.patientAge} years</p>
            </div>
          </div>
        </div>

        {/* Clinical Info */}
        {order.clinicalInfo && (
          <div className="border-t pt-4 mt-4">
            <h2 className="font-semibold text-gray-900 mb-3">Clinical Information</h2>
            <p className="text-sm text-gray-700">{order.clinicalInfo}</p>
          </div>
        )}

        {/* Tests */}
        <div className="border-t pt-4 mt-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Ordered Tests ({order.tests.length})
          </h2>
          <div className="space-y-2">
            {order.tests.map((test, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{test.name}</p>
                  <p className="text-sm text-gray-600">
                    {test.code} • {test.category}
                  </p>
                </div>
                {test.status && (
                  <Badge variant="outline" size="sm">
                    {test.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t pt-4 mt-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Order Timeline
          </h2>
          <div className="space-y-3">
            {order.timeline?.map((event, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{event.action}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(event.timestamp), 'MMM d, h:mm a')} • {event.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      {order.status === 'completed' && (
        <Card className="p-4">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate(`/clinician/results?orderId=${order.id}`)}
          >
            View Results
          </Button>
        </Card>
      )}
    </div>
  );
}
