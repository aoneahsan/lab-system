import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useCollectionRoutes, 
  useCreateRoute,
  useHomeCollections 
} from '@/hooks/useHomeCollection';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  User,
  MapPin,
  Route,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function RouteManagement() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPhlebotomist, setSelectedPhlebotomist] = useState<string>('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  
  const { data: routes = [] } = useCollectionRoutes(undefined, selectedDate);
  const { data: collections = [] } = useHomeCollections({ 
    status: ['scheduled', 'assigned'],
    dateFrom: selectedDate,
    dateTo: selectedDate
  });
  const { data: users = [] } = useUsers();
  const createRoute = useCreateRoute();

  const phlebotomists = users.filter(u => u.role === 'phlebotomist');

  const unassignedCollections = collections.filter(
    c => !c.routeId && c.status === 'scheduled'
  );

  const handleCreateRoute = async () => {
    if (!selectedPhlebotomist || selectedCollections.length === 0) return;

    const phlebotomist = phlebotomists.find(p => p.id === selectedPhlebotomist);
    
    await createRoute.mutateAsync({
      routeName: `${phlebotomist?.firstName} ${phlebotomist?.lastName} - ${format(selectedDate, 'MMM dd')}`,
      phlebotomistId: selectedPhlebotomist,
      date: format(selectedDate, 'yyyy-MM-dd'),
      collectionIds: selectedCollections,
      optimize: true
    });

    setSelectedCollections([]);
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Route Management</h1>
        <Button onClick={() => navigate('/home-collection')}>
          Back to Collections
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Phlebotomist</label>
              <Select
                value={selectedPhlebotomist}
                onChange={(e) => setSelectedPhlebotomist(e.target.value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phlebotomist" />
                </SelectTrigger>
                <SelectContent>
                  {phlebotomists.map((phlebotomist) => (
                    <SelectItem key={phlebotomist.id} value={phlebotomist.id}>
                      {phlebotomist.firstName} {phlebotomist.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCreateRoute}
                disabled={!selectedPhlebotomist || selectedCollections.length === 0 || createRoute.isPending}
                className="w-full"
              >
                <Route className="h-4 w-4 mr-2" />
                Create Route ({selectedCollections.length} collections)
              </Button>
            </div>
          </div>

          {unassignedCollections.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Unassigned Collections</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unassignedCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedCollections.includes(collection.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleCollection(collection.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium">{collection.patientName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {collection.address.line1}, {collection.address.city}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {collection.scheduledTimeSlot}
                        </p>
                      </div>
                      <Badge variant={collection.priority === 'urgent' ? 'danger' : 'default'}>
                        {collection.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Routes</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No routes scheduled for this date</p>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{route.routeName}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {route.phlebotomistName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {route.completedCollections} of {route.totalCollections} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={route.status === 'completed' ? 'success' : 'default'}>
                        {route.status}
                      </Badge>
                      {route.totalDistance > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {route.totalDistance.toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/home-collection/routes/${route.id}`)}
                    >
                      View Details
                    </Button>
                    {route.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/home-collection/routes/${route.id}/track`)}
                      >
                        Track Live
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}