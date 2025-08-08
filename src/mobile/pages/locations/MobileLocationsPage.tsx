import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, Search, Star } from 'lucide-react';

interface LabLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone: string;
  hours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  services: string[];
  rating: number;
  isOpen: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const MobileLocationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LabLocation | null>(null);

  // Mock data for lab locations
  const locations: LabLocation[] = [
    {
      id: '1',
      name: 'LabFlow Main Campus',
      address: '123 Medical Center Dr, Suite 100, City, ST 12345',
      distance: '0.5 miles',
      phone: '(555) 123-4567',
      hours: {
        weekday: '7:00 AM - 6:00 PM',
        saturday: '8:00 AM - 2:00 PM',
        sunday: 'Closed'
      },
      services: ['Blood Draw', 'Urine Tests', 'COVID-19 Testing', 'Walk-ins Welcome'],
      rating: 4.8,
      isOpen: true,
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: '2',
      name: 'LabFlow North Branch',
      address: '456 Health Plaza, Building B, City, ST 12346',
      distance: '2.3 miles',
      phone: '(555) 234-5678',
      hours: {
        weekday: '8:00 AM - 5:00 PM',
        saturday: '9:00 AM - 1:00 PM',
        sunday: 'Closed'
      },
      services: ['Blood Draw', 'Pediatric Services', 'Appointments Only'],
      rating: 4.6,
      isOpen: true,
      coordinates: { lat: 40.7260, lng: -74.0134 }
    },
    {
      id: '3',
      name: 'LabFlow Express',
      address: '789 Quick Care Lane, City, ST 12347',
      distance: '3.7 miles',
      phone: '(555) 345-6789',
      hours: {
        weekday: '6:00 AM - 8:00 PM',
        saturday: '7:00 AM - 5:00 PM',
        sunday: '10:00 AM - 4:00 PM'
      },
      services: ['Express Testing', 'Walk-ins Only', 'Results in 24hrs'],
      rating: 4.5,
      isOpen: false,
      coordinates: { lat: 40.7282, lng: -73.9942 }
    }
  ];

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGetDirections = (location: LabLocation) => {
    // In production, this would open native maps app
    const url = `https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Lab Locations</h1>
          <p className="text-sm text-gray-600 mt-1">Find a lab near you</p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location or service..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Current Location Notice */}
      <div className="px-4 py-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
          <Navigation className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Showing locations near your current location
          </p>
        </div>
      </div>

      {/* Locations List */}
      <div className="flex-1 px-4 pb-4">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No locations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  {/* Location Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="text-sm font-medium text-indigo-600">
                          {location.distance}
                        </span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{location.rating}</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          location.isOpen ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {location.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">Hours:</span>
                    </div>
                    <div className="ml-6 text-sm text-gray-600 space-y-1">
                      <div>Mon-Fri: {location.hours.weekday}</div>
                      <div>Saturday: {location.hours.saturday}</div>
                      <div>Sunday: {location.hours.sunday}</div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {location.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleGetDirections(location)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </button>
                    <button
                      onClick={() => handleCall(location.phone)}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20" />
    </div>
  );
};

export default MobileLocationsPage;