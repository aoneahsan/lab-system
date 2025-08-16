import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUrlState } from '@/hooks/useUrlState';
import {
  Settings,
  Activity,
  Webhook,
  ArrowLeft,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useEMRConnection, useTestEMRConnection, useDeleteEMRConnection } from '@/hooks/useEMR';
import { modalService } from '@/services/modal.service';
import WebhookHandlers from '@/components/emr/WebhookHandlers';
import type { ConnectionStatus } from '@/types/emr.types';

const EMRConnectionDetailPage: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useUrlState('tab', {
    defaultValue: 'overview',
    removeDefault: true
  });

  const { data: connection, isLoading } = useEMRConnection(connectionId!);
  const testConnection = useTestEMRConnection();
  const deleteConnection = useDeleteEMRConnection();

  if (isLoading || !connection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-6 w-6 text-gray-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'unauthorized':
        return <AlertCircle className="h-6 w-6 text-orange-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleDeleteConnection = async () => {
    if (await modalService.confirmDanger({
      title: 'Delete EMR Connection',
      message: `Are you sure you want to delete the connection "${connection.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })) {
      await deleteConnection.mutateAsync(connectionId!);
      navigate('/emr/connections');
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/emr/connections')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Connections
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {getStatusIcon(connection.status)}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{connection.name}</h1>
              <p className="text-gray-600 mt-1">
                {connection.systemType} • {connection.protocol?.toUpperCase()}
              </p>
              {connection.lastError && (
                <p className="text-red-600 text-sm mt-1">{connection.lastError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => testConnection.mutate(connectionId!)}
              disabled={testConnection.isPending}
              className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${testConnection.isPending ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            <button
              onClick={() => navigate(`/emr/connections/${connectionId}/edit`)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDeleteConnection}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </div>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Logs
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Connection Details</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Configuration</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">System Type:</dt>
                  <dd className="text-sm font-medium capitalize">{connection.systemType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Protocol:</dt>
                  <dd className="text-sm font-medium uppercase">{connection.protocol}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Base URL:</dt>
                  <dd className="text-sm font-medium">
                    {connection.config?.fhirBaseUrl || connection.config?.apiBaseUrl || 'N/A'}
                  </dd>
                </div>
                {(connection.config?.fhirAuth || connection.config?.apiAuth) && (
                  <div>
                    <dt className="text-sm text-gray-600">Authentication:</dt>
                    <dd className="text-sm font-medium capitalize">
                      {connection.config.fhirAuth?.type || connection.config.apiAuth?.type || 'N/A'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">Created:</dt>
                  <dd className="text-sm font-medium">
                    {connection.createdAt.toDate().toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Last Updated:</dt>
                  <dd className="text-sm font-medium">
                    {connection.updatedAt.toDate().toLocaleDateString()}
                  </dd>
                </div>
                {connection.lastSyncAt && (
                  <div>
                    <dt className="text-sm text-gray-600">Last Sync:</dt>
                    <dd className="text-sm font-medium">
                      {connection.lastSyncAt.toDate().toLocaleString()}
                    </dd>
                  </div>
                )}
                {connection.lastSyncAt && (
                  <div>
                    <dt className="text-sm text-gray-600">Last Sync:</dt>
                    <dd className="text-sm font-medium">
                      {connection.lastSyncAt.toDate().toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && <WebhookHandlers connectionId={connectionId!} />}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-center py-8">Activity logs will be displayed here.</p>
        </div>
      )}
    </div>
  );
};

export default EMRConnectionDetailPage;
