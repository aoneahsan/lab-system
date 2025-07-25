import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Vial, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useSampleStore } from '@/stores/sample.store';
import { useAuthStore } from '@/stores/auth.store';
import { Sample } from '@/types/sample.types';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function SampleList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const { currentUser } = useAuthStore();
  const { samples, loading, fetchSamples } = useSampleStore();
  const tenantId = currentUser?.tenantId || '';

  useEffect(() => {
    if (tenantId) {
      fetchSamples(tenantId, {
        status: filterStatus === 'all' ? undefined : filterStatus,
        type: filterType === 'all' ? undefined : filterType
      });
    }
  }, [tenantId, filterStatus, filterType, fetchSamples]);

  const filteredSamples = samples.filter(sample =>
    sample.sampleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: Sample['status']) => {
    switch (status) {
      case 'collected':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_transit':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'received':
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Vial className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Sample['status']) => {
    switch (status) {
      case 'collected':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-indigo-100 text-indigo-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'stored':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Sample['priority']) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'asap':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Sample Management</h1>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Register Sample
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by sample #, barcode, or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="collected">Collected</option>
            <option value="in_transit">In Transit</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="stored">Stored</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="urine">Urine</option>
            <option value="stool">Stool</option>
            <option value="swab">Swab</option>
            <option value="tissue">Tissue</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Samples Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(sample.status)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {sample.sampleNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sample.barcode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Patient ID: {sample.patientId}</div>
                    <div className="text-xs text-gray-500">Order: {sample.orderId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {sample.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(sample.priority)}`}>
                      {sample.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sample.status)}`}>
                      {sample.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sample.collectionDate.toDate().toLocaleDateString()}
                    <div className="text-xs">
                      {sample.collectionTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Track
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No samples found
          </div>
        )}
      </div>
    </div>
  );
}