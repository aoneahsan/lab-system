import { useState } from 'react';
import { Package, Thermometer, AlertCircle, Grid3X3 } from 'lucide-react';
import type { Sample, StorageTemperature } from '@/types/sample.types';

interface StorageLocationProps {
  locationId: string;
  rack: string;
  shelf: string;
  position: string;
  temperature: StorageTemperature;
  samples: Sample[];
  capacity: number;
}

const temperatureConfig = {
  room_temp: { label: 'Room Temp', color: 'text-green-600', bgColor: 'bg-green-100', temp: '20-25°C' },
  refrigerated: { label: 'Refrigerated', color: 'text-blue-600', bgColor: 'bg-blue-100', temp: '2-8°C' },
  frozen: { label: 'Frozen', color: 'text-indigo-600', bgColor: 'bg-indigo-100', temp: '-20°C' },
  ultra_frozen: { label: 'Ultra Frozen', color: 'text-purple-600', bgColor: 'bg-purple-100', temp: '-80°C' },
};

export default function SampleStorage() {
  const [selectedTemperature, setSelectedTemperature] = useState<StorageTemperature | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock storage locations data
  const storageLocations: StorageLocationProps[] = [
    {
      locationId: 'L001',
      rack: 'A',
      shelf: '1',
      position: '1-10',
      temperature: 'refrigerated',
      samples: [],
      capacity: 50,
    },
    {
      locationId: 'L002',
      rack: 'A',
      shelf: '2',
      position: '1-10',
      temperature: 'frozen',
      samples: [],
      capacity: 50,
    },
  ];

  const filteredLocations = storageLocations.filter(location => {
    const matchesTemp = selectedTemperature === 'all' || location.temperature === selectedTemperature;
    const matchesSearch = searchTerm === '' || 
      location.locationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.rack.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTemp && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Sample Storage Locations</h2>
        <button className="btn btn-primary">
          <Package className="h-4 w-4" />
          Add Storage Location
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by location ID or rack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
          
          <select
            value={selectedTemperature}
            onChange={(e) => setSelectedTemperature(e.target.value as StorageTemperature | 'all')}
            className="input"
          >
            <option value="all">All Temperatures</option>
            <option value="room_temp">Room Temperature</option>
            <option value="refrigerated">Refrigerated</option>
            <option value="frozen">Frozen</option>
            <option value="ultra_frozen">Ultra Frozen</option>
          </select>
        </div>
      </div>

      {/* Temperature Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(temperatureConfig).map(([key, config]) => (
          <div key={key} className={`${config.bgColor} p-4 rounded-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                <p className="text-xs text-gray-600 mt-1">{config.temp}</p>
              </div>
              <Thermometer className={`h-8 w-8 ${config.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {storageLocations.filter(loc => loc.temperature === key).length}
            </p>
            <p className="text-xs text-gray-600">locations</p>
          </div>
        ))}
      </div>

      {/* Storage Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => {
          const tempConfig = temperatureConfig[location.temperature];
          const occupancy = (location.samples.length / location.capacity) * 100;
          
          return (
            <div key={location.locationId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Location {location.locationId}</h3>
                  <p className="text-sm text-gray-500">
                    Rack {location.rack} - Shelf {location.shelf}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tempConfig.bgColor} ${tempConfig.color}`}>
                  {tempConfig.label}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Occupancy</span>
                    <span className="font-medium">{location.samples.length}/{location.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        occupancy > 80 ? 'bg-red-500' : occupancy > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Positions: {location.position}
                </div>

                {occupancy > 80 && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Near capacity
                  </div>
                )}

                <button className="w-full btn btn-outline btn-sm">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No storage locations found
        </div>
      )}
    </div>
  );
}