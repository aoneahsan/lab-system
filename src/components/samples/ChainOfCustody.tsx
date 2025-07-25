import React from 'react';
import { MapPin, User, Calendar, Clock, Activity } from 'lucide-react';
import { ChainOfCustodyEntry, CustodyAction } from '@/types/sample.types';

interface ChainOfCustodyProps {
  entries: ChainOfCustodyEntry[];
  sampleNumber: string;
}

export default function ChainOfCustody({ entries, sampleNumber }: ChainOfCustodyProps) {
  const getActionIcon = (action: CustodyAction) => {
    switch (action) {
      case 'collected':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'transported':
        return <MapPin className="h-5 w-5 text-yellow-500" />;
      case 'received':
        return <Activity className="h-5 w-5 text-green-500" />;
      case 'processed':
        return <Activity className="h-5 w-5 text-purple-500" />;
      case 'stored':
        return <Activity className="h-5 w-5 text-indigo-500" />;
      case 'disposed':
        return <Activity className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: CustodyAction) => {
    switch (action) {
      case 'collected':
        return 'bg-blue-100 text-blue-800';
      case 'transported':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'processed':
        return 'bg-purple-100 text-purple-800';
      case 'stored':
        return 'bg-indigo-100 text-indigo-800';
      case 'disposed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Chain of Custody - {sampleNumber}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Complete tracking history of sample handling
        </p>
      </div>

      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {entries.map((entry, index) => (
              <li key={index}>
                <div className="relative pb-8">
                  {index !== entries.length - 1 && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center ring-8 ring-white">
                        {getActionIcon(entry.action)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                            {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          {entry.notes}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{entry.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{entry.timestamp.toDate().toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{entry.timestamp.toDate().toLocaleTimeString()}</span>
                          </div>
                        </div>
                        {entry.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{entry.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}