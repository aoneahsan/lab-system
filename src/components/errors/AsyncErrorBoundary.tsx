import React, { useState, useEffect, ReactNode } from 'react';
import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { uiLogger } from '@/services/logger.service';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({ 
  children, 
  onRetry 
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      uiLogger.error('Unhandled promise rejection:', event.reason);
      setError(new Error(event.reason?.message || 'An async error occurred'));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    
    if (onRetry) {
      try {
        await onRetry();
      } catch (err) {
        setError(err as Error);
      }
    }
    
    setIsRetrying(false);
  };

  if (error) {
    const isNetworkError = error.message.toLowerCase().includes('network') || 
                          error.message.toLowerCase().includes('fetch');

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            {isNetworkError ? (
              <WifiOff className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isNetworkError ? 'Connection Error' : 'Operation Failed'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isNetworkError 
              ? 'Please check your internet connection and try again.'
              : error.message || 'An unexpected error occurred while processing your request.'
            }
          </p>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};