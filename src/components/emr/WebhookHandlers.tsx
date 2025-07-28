import React, { useState } from 'react';
import { Webhook, Plus, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useWebhookEndpoints, useCreateWebhookEndpoint, useTestWebhook } from '@/hooks/useEMR';
import type { WebhookEndpointFormData, WebhookEventType } from '@/types/webhook.types';

interface WebhookHandlersProps {
  connectionId: string;
}

interface WebhookEndpointData {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastPingAt?: { toDate: () => Date };
  lastPingStatus?: 'success' | 'failure';
  secret?: string;
}

const WebhookHandlers: React.FC<WebhookHandlersProps> = ({ connectionId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: endpoints = [], isLoading } = useWebhookEndpoints(connectionId);
  const createEndpointMutation = useCreateWebhookEndpoint();
  const testWebhookMutation = useTestWebhook();

  const [formData, setFormData] = useState<WebhookEndpointFormData>({
    connectionId,
    url: '',
    events: [],
    isActive: true,
  });

  const availableEvents: { value: WebhookEventType; label: string }[] = [
    { value: 'patient.created', label: 'Patient Created' },
    { value: 'patient.updated', label: 'Patient Updated' },
    { value: 'order.created', label: 'Order Created' },
    { value: 'order.updated', label: 'Order Updated' },
    { value: 'result.available', label: 'Result Available' },
    { value: 'result.final', label: 'Result Finalized' },
    { value: 'result.amended', label: 'Result Amended' },
  ];

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEndpointMutation.mutateAsync({ connectionId, data: formData });
    setShowAddForm(false);
    setFormData({
      connectionId,
      url: '',
      events: [],
      isActive: true,
    });
  };

  const handleTestEndpoint = async (endpointId: string) => {
    await testWebhookMutation.mutateAsync({
      connectionId,
      webhookId: endpointId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Webhook className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium">Webhook Endpoints</h3>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Endpoint
        </button>
      </div>

      {/* Add Endpoint Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <form onSubmit={handleCreateEndpoint} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="https://your-server.com/webhook"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Events to Subscribe
              </label>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label key={event.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            events: [...formData.events, event.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            events: formData.events.filter((ev) => ev !== event.value),
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createEndpointMutation.isPending || formData.events.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Create Endpoint
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Endpoints List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : endpoints.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No webhook endpoints configured</p>
          <p className="text-sm text-gray-400 mt-1">Add an endpoint to receive real-time updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(endpoints as WebhookEndpointData[]).map((endpoint) => (
            <div key={endpoint.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <p className="font-medium">{endpoint.url}</p>
                    {endpoint.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Subscribed Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  {endpoint.lastPingAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Last ping:</span>
                      <span>{new Date(endpoint.lastPingAt.toDate()).toLocaleString()}</span>
                      {endpoint.lastPingStatus === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    onChange={() => handleTestEndpoint(endpoint.id)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Test webhook...
                    </option>
                    {endpoint.events.map((event) => (
                      <option key={event} value={event}>
                        Test {event}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Webhook Secret Info */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Webhook Secret</p>
                    <p className="text-amber-700 mt-1">
                      Secret: <code className="bg-amber-100 px-1 rounded">{endpoint.secret}</code>
                    </p>
                    <p className="text-amber-600 mt-1">
                      Use this secret to verify webhook signatures in your application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Webhook Documentation */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-3">Webhook Integration Guide</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• All webhooks are sent as POST requests with JSON payloads</p>
          <p>• Verify webhook signatures using HMAC-SHA256 with your secret</p>
          <p>• Respond with 2xx status code to acknowledge receipt</p>
          <p>• Failed deliveries will be retried up to 5 times with exponential backoff</p>
          <p>• Include these headers in your webhook handler:</p>
          <ul className="ml-4 mt-2 space-y-1">
            <li>- X-Webhook-Signature: HMAC signature for verification</li>
            <li>- X-Webhook-Event: The event type</li>
            <li>- X-Webhook-Timestamp: ISO 8601 timestamp</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebhookHandlers;
