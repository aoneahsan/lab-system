import React, { useState } from 'react';
import { Plus, Beaker, Calendar, Edit } from 'lucide-react';
import { useQualityControlStore } from '@/stores/quality-control.store';
import type { QCTest } from '@/types/quality-control';

export default function QCTestList() {
  const [showAddTest, setShowAddTest] = useState(false);
  const { qcTests, loading } = useQualityControlStore();

  const getStatusColor = (status: QCTest['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiration = (expirationDate: any) => {
    const expDate = expirationDate.toDate();
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">QC Tests</h2>
        <button 
          onClick={() => setShowAddTest(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add QC Test
        </button>
      </div>

      {/* QC Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qcTests.map((test) => {
          const daysUntilExpiration = getDaysUntilExpiration(test.expirationDate);
          const isExpiringSoon = daysUntilExpiration <= 30 && daysUntilExpiration > 0;
          
          return (
            <div key={test.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <Beaker className="h-8 w-8 text-indigo-500" />
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">{test.testName}</h3>
              <p className="text-sm text-gray-600 mb-3">Lot: {test.lotNumber}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Manufacturer:</span>
                  <span className="text-gray-900">{test.manufacturer}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Levels:</span>
                  <span className="text-gray-900">{test.levels.length}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className={`${isExpiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {daysUntilExpiration > 0 
                      ? `Expires in ${daysUntilExpiration} days`
                      : 'Expired'
                    }
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                  <button className="text-sm text-indigo-600 hover:text-indigo-900">
                    View Levels
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {qcTests.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No QC tests configured</p>
          <p className="text-sm text-gray-400 mt-1">Add your first QC test to get started</p>
        </div>
      )}
    </div>
  );
}