import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  FileText, 
  CreditCard, 
  Users, 
  User,
  MapPin
} from 'lucide-react';

export const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/results', icon: FileText, label: 'Results' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/locations', icon: MapPin, label: 'Locations' },
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
                className={`flex flex-col items-center px-3 py-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};