import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError() as Error;
  const is404 = error?.message?.includes('404') || error?.message?.includes('not found');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-gray-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {is404 ? 'Page Not Found' : 'Oops! Something went wrong'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {is404 
            ? "The page you're looking for doesn't exist."
            : "We encountered an error while loading this page."
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Error Details
            </summary>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm font-mono text-gray-600">
                {error.message || 'Unknown error'}
              </p>
              {error.stack && (
                <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};