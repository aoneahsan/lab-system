import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, TestTube, QrCode, RefreshCw } from 'lucide-react';
import { useOfflineStore } from '@/mobile/stores/offline.store';

export const PhlebotomistLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingSync } = useOfflineStore();

  const navigationItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/route', icon: Map, label: 'Route' },
    { path: '/collection', icon: TestTube, label: 'Collect' },
    { path: '/scan', icon: QrCode, label: 'Scan' },
    { path: '/sync', icon: RefreshCw, label: 'Sync', badge: pendingSync },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center px-3 py-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
