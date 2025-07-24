import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/useToast';

interface RouteStop {
  id: string;
  patientName: string;
  address: string;
  phone: string;
  time: string;
  distance: string;
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
  tests: string[];
  priority: 'urgent' | 'normal';
}

const PhlebotomistRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  
  // Mock route data - in real app would come from API/local DB
  const [routeStops, setRouteStops] = useState<RouteStop[]>([
    {
      id: '1',
      patientName: 'John Doe',
      address: '123 Main St, Apt 4B',
      phone: '555-0123',
      time: '10:30 AM',
      distance: '2.3 miles',
      status: 'completed',
      tests: ['CBC', 'BMP'],
      priority: 'normal',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      address: '456 Oak Ave',
      phone: '555-0124',
      time: '11:00 AM',
      distance: '3.1 miles',
      status: 'pending',
      tests: ['Lipid Panel', 'HbA1c'],
      priority: 'urgent',
      notes: 'Patient is diabetic, handle with care',
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      address: '789 Pine Rd, Suite 200',
      phone: '555-0125',
      time: '11:30 AM',
      distance: '4.5 miles',
      status: 'pending',
      tests: ['TSH', 'T4'],
      priority: 'normal',
    },
    {
      id: '4',
      patientName: 'Mary Williams',
      address: '321 Elm St',
      phone: '555-0126',
      time: '12:00 PM',
      distance: '5.2 miles',
      status: 'pending',
      tests: ['COVID-19 PCR'],
      priority: 'normal',
    },
  ]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      console.error('Failed to get location:', error);
      toast.error('Unable to get current location');
    }
  };

  const openNavigation = async (address: string) => {
    if (Capacitor.isNativePlatform()) {
      // On mobile, open native maps app
      const encodedAddress = encodeURIComponent(address);
      const url = Capacitor.getPlatform() === 'ios' 
        ? `maps://maps.apple.com/?q=${encodedAddress}`
        : `geo:0,0?q=${encodedAddress}`;
      
      window.open(url, '_system');
    } else {
      // On web, open Google Maps
      window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const markAsCompleted = (stopId: string) => {
    setRouteStops(stops => 
      stops.map(stop => 
        stop.id === stopId ? { ...stop, status: 'completed' } : stop
      )
    );
    toast.success('Stop marked as completed');
  };

  const markAsSkipped = (stopId: string) => {
    setRouteStops(stops => 
      stops.map(stop => 
        stop.id === stopId ? { ...stop, status: 'skipped' } : stop
      )
    );
    toast.info('Stop marked as skipped');
  };

  const getStatusIcon = (status: RouteStop['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const pendingStops = routeStops.filter(stop => stop.status === 'pending').length;
  const completedStops = routeStops.filter(stop => stop.status === 'completed').length;

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Today's Route</h1>
        
        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-semibold text-green-600">{completedStops}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-xl font-semibold text-gray-900">{pendingStops}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/route/optimize')}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
          >
            Optimize Route
          </button>
        </div>

        {currentLocation && (
          <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-900">
              Current location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* Route List */}
      <div className="flex-1 px-6 py-4 space-y-4">
        {routeStops.map((stop, index) => (
          <div
            key={stop.id}
            className={`bg-white rounded-lg shadow-sm overflow-hidden ${
              stop.status === 'completed' ? 'opacity-60' : ''
            }`}
          >
            <div
              className="p-4"
              onClick={() => setSelectedStop(selectedStop === stop.id ? null : stop.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(stop.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {stop.patientName}
                      </h3>
                      {stop.priority === 'urgent' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{stop.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {stop.time}
                      </span>
                      <span>{stop.distance}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Tests: {stop.tests.join(', ')}</p>
                    </div>
                    {stop.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                        {stop.notes}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                  selectedStop === stop.id ? 'rotate-90' : ''
                }`} />
              </div>
            </div>

            {/* Expanded Actions */}
            {selectedStop === stop.id && stop.status === 'pending' && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openNavigation(stop.address);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    <Navigation className="h-4 w-4" />
                    Navigate
                  </button>
                  <a
                    href={`tel:${stop.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/collection?patientName=${encodeURIComponent(stop.patientName)}&address=${encodeURIComponent(stop.address)}`);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Collect
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsSkipped(stop.id);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhlebotomistRoutePage;