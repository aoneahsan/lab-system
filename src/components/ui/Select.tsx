import React from 'react';
import { cn } from '@/utils/cn';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

// Additional Select components for compatibility
export const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  SelectProps & { children?: React.ReactNode }
>(({ children, ...props }, ref) => {
  return <Select ref={ref} {...props} />;
});

SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = (props) => {
  return <option {...props} />;
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  if (placeholder) {
    return (
      <option value="" disabled>
        {placeholder}
      </option>
    );
  }
  return null;
};
