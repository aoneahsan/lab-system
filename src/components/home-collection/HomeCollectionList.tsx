import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeCollections } from '@/hooks/useHomeCollection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Search,
  Plus,
  Eye,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import type { HomeCollectionFilters } from '@/types/home-collection.types';

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

const priorityColors = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800'
};

export function HomeCollectionList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<HomeCollectionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: collections = [], isLoading } = useHomeCollections(filters);

  const filteredCollections = collections.filter(collection => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      collection.patientName.toLowerCase().includes(search) ||
      collection.patientPhone.includes(search) ||
      collection.address.line1.toLowerCase().includes(search) ||
      collection.address.city.toLowerCase().includes(search)
    );
  });

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilters({ ...filters, status: undefined });
    } else {
      setFilters({ ...filters, status: [status as any] });
    }
  };

  const handleDateFilter = (days: number) => {
    const today = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(today.getDate() - days);
    
    setFilters({ ...filters, dateFrom, dateTo: today });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Home Collections</h1>
        <Button onClick={() => navigate('/home-collection/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Collection
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="collecting">Collecting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleDateFilter(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Phlebotomist</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No home collections found
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{collection.patientName}</div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-1" />
                        {collection.patientPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(collection.scheduledDate, 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {collection.scheduledTimeSlot}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        {collection.address.line1}
                      </div>
                      <div className="text-sm text-gray-500">
                        {collection.address.city}, {collection.address.state}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {collection.testNames.slice(0, 2).join(', ')}
                      {collection.testNames.length > 2 && (
                        <span className="text-gray-500">
                          {' '}+{collection.testNames.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[collection.status]}>
                      {collection.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[collection.priority]}>
                      {collection.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {collection.phlebotomistName ? (
                      <div className="flex items-center text-sm">
                        <User className="h-3 w-3 mr-1" />
                        {collection.phlebotomistName}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/home-collection/${collection.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {collection.status === 'in-transit' && collection.phlebotomistId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/home-collection/track/${collection.id}`)}
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}