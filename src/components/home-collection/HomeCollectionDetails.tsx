import { useParams, useNavigate } from 'react-router-dom';
import { 
  useHomeCollection, 
  useUpdateCollectionStatus
  // TODO: Implement sample collection recording
  // useRecordSampleCollection,
  // TODO: Implement payment recording  
  // useRecordPayment 
} from '@/hooks/useHomeCollection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  TestTube,
  CreditCard,
  Navigation,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  'in-transit': 'bg-yellow-100 text-yellow-800',
  arrived: 'bg-orange-100 text-orange-800',
  collecting: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800'
};

export function HomeCollectionDetails() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { data: collection, isLoading } = useHomeCollection(collectionId!);
  const updateStatus = useUpdateCollectionStatus();

  if (isLoading) return <div>Loading...</div>;
  if (!collection) return <div>Collection not found</div>;

  const handleStatusUpdate = async (status: typeof collection.status) => {
    await updateStatus.mutateAsync({
      collectionId: collection.id,
      status
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Collection Details</h1>
        <Button variant="outline" onClick={() => navigate('/home-collection')}>
          Back to List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Patient Name</p>
              <p className="font-medium">{collection.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </p>
              <p className="font-medium">{collection.patientPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge className={statusColors[collection.status]}>
                {collection.status.replace('-', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <Badge variant="outline">{collection.priority}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(collection.scheduledDate, 'MMMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time Slot
              </p>
              <p className="font-medium">{collection.scheduledTimeSlot}</p>
            </div>
            {collection.phlebotomistName && (
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="h-3 w-3" /> Phlebotomist
                </p>
                <p className="font-medium">{collection.phlebotomistName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Collection Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p>{collection.address.line1}</p>
              {collection.address.line2 && <p>{collection.address.line2}</p>}
              <p>
                {collection.address.city}, {collection.address.state} {collection.address.postalCode}
              </p>
              {collection.address.landmark && (
                <p className="text-sm text-gray-500 mt-2">
                  Landmark: {collection.address.landmark}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Tests & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Tests</p>
              <ul className="mt-1 space-y-1">
                {collection.testNames.map((test, index) => (
                  <li key={index} className="text-sm">{test}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Payment Method
              </p>
              <p className="font-medium capitalize">{collection.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <Badge variant={collection.paymentStatus === 'collected' ? 'default' : 'outline'}>
                {collection.paymentStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {collection.status !== 'completed' && collection.status !== 'cancelled' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {collection.status === 'scheduled' && (
                <Button 
                  onClick={() => handleStatusUpdate('assigned')}
                  disabled={updateStatus.isPending}
                >
                  Mark as Assigned
                </Button>
              )}
              {collection.status === 'assigned' && (
                <Button 
                  onClick={() => handleStatusUpdate('in-transit')}
                  disabled={updateStatus.isPending}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Transit
                </Button>
              )}
              {collection.status === 'in-transit' && (
                <Button 
                  onClick={() => handleStatusUpdate('arrived')}
                  disabled={updateStatus.isPending}
                >
                  Mark as Arrived
                </Button>
              )}
              {collection.status === 'arrived' && (
                <Button 
                  onClick={() => handleStatusUpdate('collecting')}
                  disabled={updateStatus.isPending}
                >
                  Start Collection
                </Button>
              )}
              {collection.status === 'collecting' && (
                <Button 
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updateStatus.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Collection
                </Button>
              )}
              <Button 
                variant="danger"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {collection.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{collection.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}