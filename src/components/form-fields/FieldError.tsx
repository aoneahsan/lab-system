import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  error?: string | { message?: string };
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  
  if (!errorMessage) return null;

  return (
    <div className={`flex items-start mt-1.5 space-x-1.5 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-600 dark:text-red-400">
        {errorMessage}
      </p>
    </div>
  );
};

// Utility function to scroll to first error field
export const scrollToFirstError = (errors: Record<string, any>) => {
  const firstErrorKey = Object.keys(errors).find(key => errors[key]);
  
  if (firstErrorKey) {
    // Try to find the field by name or id
    const errorField = document.querySelector(
      `[name="${firstErrorKey}"], [id="${firstErrorKey}"], [data-field-name="${firstErrorKey}"]`
    );
    
    if (errorField) {
      // Scroll to the field with some offset
      const yOffset = -100; // Offset to account for fixed headers
      const y = errorField.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      // Focus the field if it's an input
      if (errorField instanceof HTMLInputElement || 
          errorField instanceof HTMLTextAreaElement || 
          errorField instanceof HTMLSelectElement) {
        setTimeout(() => {
          (errorField as HTMLElement).focus();
        }, 500);
      }
    }
  }
};

// Required field indicator component
interface RequiredIndicatorProps {
  required?: boolean;
}

export const RequiredIndicator: React.FC<RequiredIndicatorProps> = ({ required }) => {
  if (!required) return null;
  
  return (
    <span className="text-red-500 dark:text-red-400 ml-1" aria-label="required">
      *
    </span>
  );
};