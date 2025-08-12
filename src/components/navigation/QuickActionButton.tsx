import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Users, TestTube, FileText, CreditCard, Package, 
  BarChart3, Calendar, Home, Clipboard, FlaskConical
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

const quickActions: QuickAction[] = [
  { id: 'patients', label: 'Patients', icon: <Users className="h-5 w-5" />, path: '/patients' },
  { id: 'tests', label: 'Tests', icon: <TestTube className="h-5 w-5" />, path: '/tests' },
  { id: 'samples', label: 'Samples', icon: <FlaskConical className="h-5 w-5" />, path: '/samples' },
  { id: 'results', label: 'Results', icon: <Clipboard className="h-5 w-5" />, path: '/results' },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="h-5 w-5" />, path: '/billing' },
  { id: 'inventory', label: 'Inventory', icon: <Package className="h-5 w-5" />, path: '/inventory' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, path: '/reports' },
  { id: 'appointments', label: 'Appointments', icon: <Calendar className="h-5 w-5" />, path: '/appointments' },
  { id: 'home-collection', label: 'Home Collection', icon: <Home className="h-5 w-5" />, path: '/home-collection' },
];

export const QuickActionButton: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('quickActionPosition');
    if (savedPosition && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(savedPosition)) {
      setPosition(savedPosition as Position);
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('quickActionPosition', position);
  }, [position]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
    e.preventDefault();
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Only change position if dragged more than 50px
    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const isLeft = clientX < viewportWidth / 2;
      const isTop = clientY < viewportHeight / 2;
      
      const newPosition: Position = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Position;
      setPosition(newPosition);
    }
    
    setIsDragging(false);
  };

  const handleActionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Filter actions based on user role
  const filteredActions = quickActions.filter(action => {
    if (!action.roles) return true;
    return action.roles.includes(currentUser?.role || '');
  });

  const positionClasses = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const menuPositionClasses = {
    'top-left': 'top-16 left-0',
    'top-right': 'top-16 right-0',
    'bottom-left': 'bottom-16 left-0',
    'bottom-right': 'bottom-16 right-0',
  };

  return (
    <div
      ref={buttonRef}
      className={`fixed z-40 ${positionClasses[position]} ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      {/* Action Menu */}
      {isOpen && (
        <div className={`absolute ${menuPositionClasses[position]} bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-2 min-w-[200px]`}>
          <div className="grid gap-1">
            {filteredActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.path)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        className={`relative group bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all transform hover:scale-110 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        title="Quick Actions (drag to reposition)"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
        
        {/* Drag Hint */}
        {!isOpen && !isDragging && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Drag to reposition
          </div>
        )}
      </button>
    </div>
  );
};