import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookService } from '@/services/webhook.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import type {
  WebhookEndpointFormData,
  WebhookTestPayload,
  WebhookEventType,
} from '@/types/webhook.types';

// Query keys
const WEBHOOK_KEYS = {
  all: ['webhooks'] as const,
  endpoints: () => [...WEBHOOK_KEYS.all, 'endpoints'] as const,
  endpoint: (id: string) => [...WEBHOOK_KEYS.endpoints(), id] as const,
  endpointsByConnection: (connectionId: string) =>
    [...WEBHOOK_KEYS.endpoints(), 'connection', connectionId] as const,
  metrics: (endpointId: string) => [...WEBHOOK_KEYS.all, 'metrics', endpointId] as const,
};

// Webhook endpoints
export const useWebhookEndpoints = (connectionId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: WEBHOOK_KEYS.endpointsByConnection(connectionId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.getEndpointsByConnection(currentTenant.id, connectionId);
    },
    enabled: !!currentTenant && !!connectionId,
  });
};

export const useWebhookEndpoint = (endpointId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: WEBHOOK_KEYS.endpoint(endpointId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.getEndpoint(currentTenant.id, endpointId);
    },
    enabled: !!currentTenant && !!endpointId,
  });
};

export const useCreateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: WebhookEndpointFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return webhookService.createEndpoint(currentTenant.id, currentUser.id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.endpoints() });
      queryClient.invalidateQueries({
        queryKey: WEBHOOK_KEYS.endpointsByConnection(variables.connectionId),
      });
      toast.success('Webhook endpoint created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create webhook endpoint');
      console.error('Error creating webhook endpoint:', error);
    },
  });
};

export const useUpdateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      endpointId,
      data,
    }: {
      endpointId: string;
      data: Partial<WebhookEndpointFormData>;
    }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return webhookService.updateEndpoint(currentTenant.id, currentUser.id, endpointId, data);
    },
    onSuccess: (_, { endpointId }) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.endpoints() });
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.endpoint(endpointId) });
      toast.success('Webhook endpoint updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update webhook endpoint');
      console.error('Error updating webhook endpoint:', error);
    },
  });
};

export const useDeleteWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (endpointId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.deleteEndpoint(currentTenant.id, endpointId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.endpoints() });
      toast.success('Webhook endpoint deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete webhook endpoint');
      console.error('Error deleting webhook endpoint:', error);
    },
  });
};

export const useTestWebhookEndpoint = () => {
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({
      endpointId,
      testPayload,
    }: {
      endpointId: string;
      testPayload: WebhookTestPayload;
    }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.testEndpoint(currentTenant.id, endpointId, testPayload);
    },
    onSuccess: (success) => {
      if (success) {
        toast.success('Webhook test successful');
      } else {
        toast.error('Webhook test failed');
      }
    },
    onError: (error) => {
      toast.error('Failed to test webhook');
      console.error('Error testing webhook:', error);
    },
  });
};

export const useWebhookMetrics = (endpointId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: WEBHOOK_KEYS.metrics(endpointId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.getMetrics(currentTenant.id, endpointId);
    },
    enabled: !!currentTenant && !!endpointId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useWebhookEventHistory = (endpointId: string, limit = 50) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: [...WEBHOOK_KEYS.endpoints(), endpointId, 'history', limit],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.getEventHistory(currentTenant.id, endpointId, limit);
    },
    enabled: !!currentTenant && !!endpointId,
  });
};

export const useResendWebhookEvent = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (eventId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.resendWebhookEvent(currentTenant.id, eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.all });
      toast.success('Webhook event resent successfully');
    },
    onError: (error) => {
      toast.error('Failed to resend webhook event');
      console.error('Error resending webhook event:', error);
    },
  });
};

export const useTriggerWebhookEvent = () => {
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({
      eventType,
      payload,
    }: {
      eventType: WebhookEventType;
      payload: Record<string, unknown>;
    }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.triggerWebhookEvent(currentTenant.id, eventType, payload);
    },
    onError: (error) => {
      console.error('Error triggering webhook event:', error);
    },
  });
};

export const useProcessWebhookBatch = () => {
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.processWebhookBatch(currentTenant.id);
    },
    onSuccess: () => {
      toast.success('Webhook batch processed successfully');
    },
    onError: (error) => {
      toast.error('Failed to process webhook batch');
      console.error('Error processing webhook batch:', error);
    },
  });
};
