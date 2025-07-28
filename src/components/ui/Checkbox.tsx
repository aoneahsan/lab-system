import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, ...props }, ref) => {
    const checkboxInput = (
      <input
        ref={ref}
        type="checkbox"
        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${className}`}
        {...props}
      />
    );

    if (label) {
      return (
        <label className="flex items-center">
          {checkboxInput}
          <span className="ml-2 text-sm text-gray-700">{label}</span>
        </label>
      );
    }

    return checkboxInput;
  }
);

Checkbox.displayName = 'Checkbox';
