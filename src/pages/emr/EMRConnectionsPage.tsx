import React, { useState } from 'react';
import { 
  Link2, 
  Plus, 
  RefreshCw, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';
import { useEMRConnections, useTestEMRConnection, useDeleteEMRConnection } from '@/hooks/useEMR';
import type { EMRConnectionFilter, ConnectionStatus } from '@/types/emr.types';

const EMRConnectionsPage: React.FC = () => {
  const [filter, setFilter] = useState<EMRConnectionFilter>({});
  const { data: connections = [], isLoading } = useEMRConnections(filter);
  const testConnection = useTestEMRConnection();
  const deleteConnection = useDeleteEMRConnection();

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'unauthorized':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    const statusColors = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      unauthorized: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${statusColors[status]}`}>
        {status}
      </span>
    );
  };

  const handleDeleteConnection = async (connectionId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the connection "${name}"?`)) {
      deleteConnection.mutate(connectionId);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EMR Connections</h1>
            <p className="text-gray-600 mt-2">Manage your Electronic Medical Record integrations</p>
          </div>
          <button
            onClick={() => window.location.href = '/emr/connections/new'}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Connection
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={filter.systemType || ''}
            onChange={(e) => setFilter({ ...filter, systemType: e.target.value || undefined })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Systems</option>
            <option value="epic">Epic</option>
            <option value="cerner">Cerner</option>
            <option value="allscripts">Allscripts</option>
            <option value="athenahealth">AthenaHealth</option>
            <option value="nextgen">NextGen</option>
            <option value="eclinicalworks">eClinicalWorks</option>
            <option value="practicefusion">Practice Fusion</option>
            <option value="custom">Custom</option>
          </select>
          
          <select
            value={filter.protocol || ''}
            onChange={(e) => setFilter({ ...filter, protocol: e.target.value || undefined })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Protocols</option>
            <option value="fhir">FHIR</option>
            <option value="hl7v2">HL7 v2.x</option>
            <option value="hl7v3">HL7 v3</option>
            <option value="api">REST API</option>
            <option value="webhook">Webhook</option>
            <option value="file">File Based</option>
          </select>
          
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
            <option value="unauthorized">Unauthorized</option>
          </select>
        </div>
      </div>

      {/* Connections List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No EMR connections found.</p>
            <button
              onClick={() => window.location.href = '/emr/connections/new'}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create First Connection
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Connection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Protocol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {connections.map((connection) => (
                  <tr key={connection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(connection.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                          {connection.lastError && (
                            <div className="text-sm text-red-600">{connection.lastError}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {connection.systemType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 uppercase">
                        {connection.protocol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(connection.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {connection.lastSyncAt ? (
                          <>
                            {connection.lastSyncAt.toDate().toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                              {connection.lastSyncAt.toDate().toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Never synced</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.location.href = `/emr/connections/${connection.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => testConnection.mutate(connection.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        disabled={testConnection.isPending}
                        title="Test Connection"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.location.href = `/emr/connections/${connection.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConnection(connection.id, connection.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EMRConnectionsPage;