import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Navigation,
  Battery,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useOfflineStore } from '@/mobile/stores/offline.store';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';

interface CollectionStats {
  scheduled: number;
  completed: number;
  pending: number;
  nextStop?: {
    patientName: string;
    address: string;
    time: string;
    distance: string;
  };
}

const PhlebotomistHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { pendingSync, isOnline, lastSyncTime } = useOfflineStore();
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Mock stats - in real app would fetch from API/local DB
  const stats: CollectionStats = {
    scheduled: 12,
    completed: 5,
    pending: 7,
    nextStop: {
      patientName: 'John Doe',
      address: '123 Main St, Apt 4B',
      time: '10:30 AM',
      distance: '2.3 miles',
    },
  };

  useEffect(() => {
    initializeDeviceInfo();
    getCurrentLocation();
  }, []);

  const initializeDeviceInfo = async () => {
    try {
      const info = await Device.getBatteryInfo();
      if (info.batteryLevel !== undefined) {
        setBatteryLevel(Math.round(info.batteryLevel * 100));
      }
    } catch (error) {
      console.error('Failed to get battery info:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const quickActions = [
    {
      icon: Map,
      title: 'View Route',
      subtitle: `${stats.pending} stops remaining`,
      color: 'bg-blue-500',
      path: '/route',
    },
    {
      icon: TestTube,
      title: 'Collect Sample',
      subtitle: 'Start new collection',
      color: 'bg-purple-500',
      path: '/collection',
    },
    {
      icon: Clock,
      title: 'Schedule',
      subtitle: `${stats.scheduled} appointments`,
      color: 'bg-green-500',
      path: '/schedule',
    },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header with device info */}
      <div className="bg-purple-600 text-white px-6 pt-12 pb-20">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Hello, {currentUser?.displayName?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-purple-100 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Battery className="h-5 w-5" />
              <span className="text-sm">{batteryLevel}%</span>
            </div>
            {isOnline ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5 text-yellow-300" />
            )}
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <h3 className="text-sm text-purple-100 mb-2">Today's Progress</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold">
              {stats.completed}/{stats.scheduled}
            </span>
            <span className="text-sm text-purple-100">Collections</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${(stats.completed / stats.scheduled) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-10">
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div
                  className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500 mt-1">{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Stop Card */}
      {stats.nextStop && (
        <div className="px-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Next Stop</h3>
              <button
                onClick={() => navigate('/route')}
                className="flex items-center gap-1 text-blue-600 text-sm"
              >
                <Navigation className="h-4 w-4" />
                Navigate
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{stats.nextStop.patientName}</p>
              <p className="text-sm text-gray-600">{stats.nextStop.address}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {stats.nextStop.time}
                </span>
                <span>{stats.nextStop.distance}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status */}
      <div className="px-6 mt-6">
        <div className={`rounded-lg p-4 ${pendingSync > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pendingSync > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    pendingSync > 0 ? 'text-yellow-900' : 'text-green-900'
                  }`}
                >
                  {pendingSync > 0 ? `${pendingSync} collections pending sync` : 'All data synced'}
                </p>
                {lastSyncTime && (
                  <p className="text-xs text-gray-600 mt-1">
                    Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            {pendingSync > 0 && (
              <button
                onClick={() => navigate('/sync')}
                className="text-sm text-yellow-600 font-medium"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Location (for debugging) */}
      {currentLocation && (
        <div className="px-6 mt-4 pb-20">
          <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600">
            <p>
              Current Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebotomistHomePage;
