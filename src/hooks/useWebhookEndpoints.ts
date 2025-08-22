import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookService } from '@/services/webhook.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import type { WebhookEndpointFormData, WebhookTestPayload } from '@/types/webhook.types';
import { logger } from '@/services/logger.service';

// Query keys
const WEBHOOK_KEYS = {
  all: ['webhooks'] as const,
  endpoints: () => [...WEBHOOK_KEYS.all, 'endpoints'] as const,
  endpoint: (id: string) => [...WEBHOOK_KEYS.endpoints(), id] as const,
  endpointsByConnection: (connectionId: string) =>
    [...WEBHOOK_KEYS.endpoints(), 'connection', connectionId] as const,
  events: () => [...WEBHOOK_KEYS.all, 'events'] as const,
  eventHistory: (endpointId: string) => [...WEBHOOK_KEYS.events(), 'history', endpointId] as const,
  metrics: (endpointId: string) => [...WEBHOOK_KEYS.all, 'metrics', endpointId] as const,
};

// Webhook Endpoints
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
      logger.error('Error creating webhook endpoint:', error);
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
      logger.error('Error updating webhook endpoint:', error);
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
      logger.error('Error deleting webhook endpoint:', error);
    },
  });
};

export const useTestWebhook = () => {
  const queryClient = useQueryClient();
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
    onSuccess: (success, { endpointId }) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.endpoint(endpointId) });
      if (success) {
        toast.success('Webhook test successful');
      } else {
        toast.error('Webhook test failed');
      }
    },
    onError: (error) => {
      toast.error('Failed to test webhook');
      logger.error('Error testing webhook:', error);
    },
  });
};

// Event History
export const useWebhookEventHistory = (endpointId: string, limit = 50) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: WEBHOOK_KEYS.eventHistory(endpointId),
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
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.events() });
      toast.success('Webhook event resent successfully');
    },
    onError: (error) => {
      toast.error('Failed to resend webhook event');
      logger.error('Error resending webhook event:', error);
    },
  });
};

// Webhook Metrics
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

// Process pending webhooks
export const useProcessWebhookBatch = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.processWebhookBatch(currentTenant.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.events() });
      toast.success('Webhook batch processed successfully');
    },
    onError: (error) => {
      toast.error('Failed to process webhook batch');
      logger.error('Error processing webhook batch:', error);
    },
  });
};

// Verify webhook signature
export const useVerifyWebhookSignature = () => {
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({
      secret,
      payload,
      signature,
      timestamp,
    }: {
      secret: string;
      payload: string;
      signature: string;
      timestamp: string;
    }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return webhookService.verifyWebhookSignature(secret, payload, signature, timestamp);
    },
    onSuccess: (isValid) => {
      if (isValid) {
        toast.success('Webhook signature is valid');
      } else {
        toast.error('Webhook signature is invalid');
      }
    },
    onError: (error) => {
      toast.error('Failed to verify webhook signature');
      logger.error('Error verifying webhook signature:', error);
    },
  });
};
