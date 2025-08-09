import React, { useState, useEffect } from 'react';
import { Home, Calendar, QrCode, Package, User, Navigation, Wifi, WifiOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  HomeScreen,
  CollectionScreen,
  ScanScreen,
  InventoryScreen,
  ProfileScreen,
} from './phlebotomist/screens';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'collection', label: 'Collection', icon: Calendar },
  { id: 'scan', label: 'Scan', icon: QrCode },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'profile', label: 'Profile', icon: User },
];

export const PhlebotomistApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCollections] = useState(3);

  useEffect(() => {
    // Configure status bar
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      
      // Monitor network status
      Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
      });
      
      // Get current location for route optimization
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      setCurrentLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleTabChange = async (tabId: string) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    setActiveTab(tabId);
    
    // Special handling for scan tab
    if (tabId === 'scan' && Capacitor.isNativePlatform()) {
      // Will trigger camera permissions if needed
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'collection':
        return <CollectionScreen />;
      case 'scan':
        return <ScanScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with status indicators */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 pt-safe pb-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">LabFlow Phlebotomist</h1>
            <div className="flex items-center space-x-3">
              {/* Active Collections Badge */}
              {activeCollections > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                  {activeCollections} active
                </span>
              )}
              
              {/* Location Status */}
              {currentLocation && (
                <Navigation className="h-4 w-4 text-green-600" />
              )}
              
              {/* Network Status */}
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              
              {/* Zone Indicator */}
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">Zone A</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content with offline indicator */}
      <main className="overflow-y-auto flex-1 relative">
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-200 px-4 py-2 z-10">
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="h-4 w-4 text-yellow-700" />
              <span className="text-sm text-yellow-700 font-medium">Offline Mode - Data will sync when connected</span>
            </div>
          </div>
        )}
        {renderContent()}
      </main>

      {/* Bottom Navigation with badge */}
      <nav className="bg-white border-t border-gray-200">
        <div className="flex justify-around pb-safe">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center py-2 px-3 flex-1 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 active:text-gray-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {tab.id === 'collection' && activeCollections > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{activeCollections}</span>
                    </span>
                  )}
                  {tab.id === 'scan' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className="mt-1 text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};