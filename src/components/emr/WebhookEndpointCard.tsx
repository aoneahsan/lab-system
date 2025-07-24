import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Activity,
  Send,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { useTestWebhookEndpoint, useWebhookMetrics, useWebhookEventHistory } from '@/hooks/useWebhooks';
import type { WebhookEndpoint, WebhookEventType } from '@/types/webhook.types';

interface WebhookEndpointCardProps {
  endpoint: WebhookEndpoint;
  onEdit: () => void;
  onDelete: () => void;
}

export const WebhookEndpointCard: React.FC<WebhookEndpointCardProps> = ({
  endpoint,
  onEdit,
  onDelete
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<WebhookEventType>('patient.created');
  
  const testWebhook = useTestWebhookEndpoint();
  const { data: metrics } = useWebhookMetrics(endpoint.id);
  const { data: eventHistory = [] } = useWebhookEventHistory(endpoint.id, 10);

  const getStatusIcon = () => {
    if (!endpoint.lastPingAt) {
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
    return endpoint.lastPingStatus === 'success' 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const handleTest = () => {
    testWebhook.mutate({
      endpointId: endpoint.id,
      testPayload: {
        eventType: selectedEventType
      }
    });
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{endpoint.url}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {endpoint.isActive ? 'Active' : 'Inactive'} • 
                {endpoint.events.length} event{endpoint.events.length !== 1 ? 's' : ''} subscribed
              </p>
              {endpoint.lastPingAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Last ping: {endpoint.lastPingAt.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Test Webhook */}
        <div className="mt-4 flex items-center gap-2">
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value as WebhookEventType)}
            className="text-sm rounded-md border-gray-300"
          >
            {endpoint.events.map(event => (
              <option key={event} value={event}>
                {formatEventType(event)}
              </option>
            ))}
          </select>
          <button
            onClick={handleTest}
            disabled={testWebhook.isPending}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-2"
          >
            <Send className="h-3 w-3" />
            Test Webhook
          </button>
        </div>

        {/* Metrics Summary */}
        {metrics && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Total Events</span>
              </div>
              <p className="text-lg font-semibold">{metrics.totalEvents}</p>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Successful</span>
              </div>
              <p className="text-lg font-semibold">{metrics.successfulDeliveries}</p>
            </div>
            <div className="bg-red-50 rounded p-3">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Failed</span>
              </div>
              <p className="text-lg font-semibold">{metrics.failedDeliveries}</p>
            </div>
          </div>
        )}

        {/* Show Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200 p-6">
          {/* Subscribed Events */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Subscribed Events</h4>
            <div className="flex flex-wrap gap-2">
              {endpoint.events.map(event => (
                <span
                  key={event}
                  className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                >
                  {formatEventType(event)}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          {eventHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Events</h4>
              <div className="space-y-2">
                {eventHistory.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {event.status === 'delivered' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : event.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-gray-600">{formatEventType(event.eventType)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              {eventHistory.length > 5 && (
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                  View all events →
                </button>
              )}
            </div>
          )}

          {/* Webhook Secret */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Webhook Secret</h4>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {endpoint.secret.substring(0, 8)}...{endpoint.secret.substring(endpoint.secret.length - 4)}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(endpoint.secret)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Copy full secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};