import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onSelect?: () => void;
  onClick?: () => void; // Support both onSelect and onClick
  disabled?: boolean;
}

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  asChild, 
  className 
}) => {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  const handleClick = () => {
    context.setOpen(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      className: cn(children.props.className, className),
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('inline-flex items-center justify-center', className)}
    >
      {children}
    </button>
  );
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  className,
  align = 'start',
  sideOffset = 4
}) => {
  const context = React.useContext(DropdownContext);
  const ref = useRef<HTMLDivElement>(null);
  
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context.setOpen(false);
      }
    };

    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context.open, context]);

  if (!context.open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md',
        'dark:bg-gray-800 dark:border-gray-700',
        alignClasses[align],
        className
      )}
      style={{ marginTop: `${sideOffset}px` }}
    >
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className,
  onSelect,
  onClick,
  disabled = false
}) => {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuItem must be used within DropdownMenu');

  const handleClick = () => {
    if (!disabled) {
      if (onClick) onClick();
      if (onSelect) onSelect();
      context.setOpen(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-gray-100 hover:text-gray-900',
        'dark:hover:bg-gray-700 dark:hover:text-gray-100',
        'focus:bg-gray-100 focus:text-gray-900',
        'dark:focus:bg-gray-700 dark:focus:text-gray-100',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700', className)} />
  );
};

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>
      {children}
    </div>
  );
};