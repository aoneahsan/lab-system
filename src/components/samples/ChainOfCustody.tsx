import React from 'react';
import { Clock, User, MapPin, ArrowRight } from 'lucide-react';
import type { ChainOfCustodyEntry } from '@/types/sample.types';

interface ChainOfCustodyProps {
  entries: ChainOfCustodyEntry[];
}

const ChainOfCustody: React.FC<ChainOfCustodyProps> = ({ entries }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'collected':
        return <div className="w-3 h-3 bg-blue-500 rounded-full" />;
      case 'transported':
        return <ArrowRight className="h-3 w-3 text-purple-500" />;
      case 'received':
        return <MapPin className="h-3 w-3 text-green-500" />;
      case 'processed':
        return <div className="w-3 h-3 bg-orange-500 rounded-full" />;
      case 'stored':
        return <div className="w-3 h-3 bg-indigo-500 rounded-full" />;
      case 'retrieved':
        return <ArrowRight className="h-3 w-3 text-teal-500" />;
      case 'disposed':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No chain of custody entries recorded</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {entries.map((entry, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== entries.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    {getActionIcon(entry.action)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {entry.action.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      <User className="inline h-3 w-3 mr-1" />
                      {entry.userName}
                      {entry.location && (
                        <>
                          {' • '}
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {entry.location}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {new Date(entry.timestamp.toDate()).toLocaleString()}
                  </div>
                  {entry.notes && (
                    <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChainOfCustody;