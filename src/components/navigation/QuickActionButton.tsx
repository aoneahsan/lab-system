import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Users, TestTube, FileText, CreditCard, Package, 
  BarChart3, Calendar, Home, Clipboard, FlaskConical, GripVertical
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
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !buttonRef.current) return;
      
      const deltaX = e.clientX - initialPosition.x;
      const deltaY = e.clientY - initialPosition.y;
      
      setDragPosition({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const isLeft = centerX < viewportWidth / 2;
      const isTop = centerY < viewportHeight / 2;
      
      const newPosition: Position = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Position;
      setPosition(newPosition);
      
      setIsDragging(false);
      setDragPosition({ x: 0, y: 0 });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !buttonRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - initialPosition.x;
      const deltaY = touch.clientY - initialPosition.y;
      
      setDragPosition({ x: deltaX, y: deltaY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging || !buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const isLeft = centerX < viewportWidth / 2;
      const isTop = centerY < viewportHeight / 2;
      
      const newPosition: Position = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Position;
      setPosition(newPosition);
      
      setIsDragging(false);
      setDragPosition({ x: 0, y: 0 });
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, initialPosition]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setInitialPosition({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleActionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Filter actions based on user role (show all in dev mode)
  const filteredActions = quickActions;

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

  const dragStyle = isDragging ? {
    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
    transition: 'none',
    zIndex: 9999,
  } : {};

  return (
    <div
      ref={buttonRef}
      className={`fixed z-40 ${positionClasses[position]}`}
      style={dragStyle}
    >
      {/* Action Menu */}
      {isOpen && !isDragging && (
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

      {/* Main Button with Drag Handle */}
      <div className="relative">
        <button
          className={`relative group bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all transform ${
            !isDragging ? 'hover:scale-110' : ''
          }`}
          onClick={() => !isDragging && setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
        
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          className={`absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 cursor-move shadow-md ${
            isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          title="Drag to reposition"
        >
          <GripVertical className="h-3 w-3" />
        </div>
      </div>
      
      {/* Tooltip */}
      {!isOpen && !isDragging && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Quick Actions
        </div>
      )}
    </div>
  );
};