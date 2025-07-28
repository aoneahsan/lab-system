import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import {
  useCreateWebhookEndpoint,
  useUpdateWebhookEndpoint,
  useWebhookEndpoint,
} from '@/hooks/useWebhooks';
import type { WebhookEventType, WebhookEndpointFormData } from '@/types/webhook.types';

interface WebhookEndpointModalProps {
  connectionId: string;
  endpointId?: string | null;
  onClose: () => void;
}

const WEBHOOK_EVENTS: { value: WebhookEventType; label: string; description: string }[] = [
  {
    value: 'patient.created',
    label: 'Patient Created',
    description: 'Triggered when a new patient is registered',
  },
  {
    value: 'patient.updated',
    label: 'Patient Updated',
    description: 'Triggered when patient information is modified',
  },
  {
    value: 'patient.merged',
    label: 'Patient Merged',
    description: 'Triggered when duplicate patient records are merged',
  },
  {
    value: 'order.created',
    label: 'Order Created',
    description: 'Triggered when a new lab order is placed',
  },
  {
    value: 'order.updated',
    label: 'Order Updated',
    description: 'Triggered when order status or details change',
  },
  {
    value: 'order.cancelled',
    label: 'Order Cancelled',
    description: 'Triggered when an order is cancelled',
  },
  {
    value: 'result.available',
    label: 'Result Available',
    description: 'Triggered when preliminary results are ready',
  },
  {
    value: 'result.amended',
    label: 'Result Amended',
    description: 'Triggered when results are corrected or amended',
  },
  {
    value: 'result.final',
    label: 'Result Final',
    description: 'Triggered when results are finalized and approved',
  },
  {
    value: 'appointment.scheduled',
    label: 'Appointment Scheduled',
    description: 'Triggered when a lab appointment is scheduled',
  },
  {
    value: 'appointment.cancelled',
    label: 'Appointment Cancelled',
    description: 'Triggered when an appointment is cancelled',
  },
  {
    value: 'document.received',
    label: 'Document Received',
    description: 'Triggered when documents are received from EMR',
  },
];

export const WebhookEndpointModal: React.FC<WebhookEndpointModalProps> = ({
  connectionId,
  endpointId,
  onClose,
}) => {
  const [formData, setFormData] = useState<WebhookEndpointFormData>({
    connectionId,
    url: '',
    events: [],
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existingEndpoint } = useWebhookEndpoint(endpointId || '');
  const createEndpoint = useCreateWebhookEndpoint();
  const updateEndpoint = useUpdateWebhookEndpoint();

  useEffect(() => {
    if (existingEndpoint) {
      setFormData({
        connectionId: existingEndpoint.connectionId,
        url: existingEndpoint.url,
        events: existingEndpoint.events,
        secret: existingEndpoint.secret,
        isActive: existingEndpoint.isActive,
      });
    }
  }, [existingEndpoint]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.url) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
        if (!formData.url.startsWith('https://')) {
          newErrors.url = 'URL must use HTTPS';
        }
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (formData.events.length === 0) {
      newErrors.events = 'Select at least one event';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (endpointId) {
        await updateEndpoint.mutateAsync({
          endpointId,
          data: formData,
        });
      } else {
        await createEndpoint.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving webhook endpoint:', error);
    }
  };

  const toggleEvent = (event: WebhookEventType) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {endpointId ? 'Edit Webhook Endpoint' : 'Add Webhook Endpoint'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]"
        >
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/webhooks/labflow"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Must be a secure HTTPS endpoint that can receive POST requests
            </p>
          </div>

          {/* Secret Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret (Optional)
            </label>
            <input
              type="text"
              value={formData.secret || ''}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              placeholder="Leave blank to auto-generate"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Used to sign webhook payloads for security. A secret will be generated if not
              provided.
            </p>
          </div>

          {/* Events Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscribed Events
            </label>
            {errors.events && <p className="mb-2 text-sm text-red-600">{errors.events}</p>}
            <div className="space-y-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.value)}
                    onChange={() => toggleEvent(event.value)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{event.label}</div>
                    <div className="text-sm text-gray-500">{event.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500 ml-6">
              Inactive endpoints will not receive webhook events
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Webhook Security</h4>
                <div className="mt-1 text-sm text-blue-700">
                  <p>All webhook payloads will be signed with HMAC-SHA256.</p>
                  <p className="mt-1">
                    Verify the signature by checking the{' '}
                    <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                      X-Webhook-Signature
                    </code>{' '}
                    header against the computed HMAC of the request body.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEndpoint.isPending || updateEndpoint.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createEndpoint.isPending || updateEndpoint.isPending ? 'Saving...' : 'Save Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
