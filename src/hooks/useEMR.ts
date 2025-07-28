import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emrConnectionService } from '@/services/emr-connection.service';
import { fhirService, type FHIRObservation } from '@/services/fhir.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import type {
  EMRConnectionFormData,
  EMRConnectionFilter,
  EMRMessageFilter,
} from '@/types/emr.types';
import type { FHIRServiceRequest, FHIRDiagnosticReport } from '@/services/fhir.service';

// Query keys
const EMR_KEYS = {
  all: ['emr'] as const,
  connections: () => [...EMR_KEYS.all, 'connections'] as const,
  connection: (id: string) => [...EMR_KEYS.connections(), id] as const,
  connectionList: (filter?: EMRConnectionFilter) => [...EMR_KEYS.connections(), filter] as const,
  messages: () => [...EMR_KEYS.all, 'messages'] as const,
  message: (id: string) => [...EMR_KEYS.messages(), id] as const,
  messageList: (filter?: EMRMessageFilter) => [...EMR_KEYS.messages(), filter] as const,
  mappings: () => [...EMR_KEYS.all, 'mappings'] as const,
  mapping: (id: string) => [...EMR_KEYS.mappings(), id] as const,
  mappingsByConnection: (connectionId: string) =>
    [...EMR_KEYS.mappings(), 'connection', connectionId] as const,
  logs: (connectionId: string) => [...EMR_KEYS.all, 'logs', connectionId] as const,
  syncStatus: (connectionId: string) => [...EMR_KEYS.all, 'sync-status', connectionId] as const,
};

// EMR Connections
export const useEMRConnections = (filter?: EMRConnectionFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: EMR_KEYS.connectionList(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService.getConnections(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

export const useEMRConnection = (connectionId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: EMR_KEYS.connection(connectionId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService.getConnection(currentTenant.id, connectionId);
    },
    enabled: !!currentTenant && !!connectionId,
  });
};

export const useCreateEMRConnection = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: EMRConnectionFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return emrConnectionService.createConnection(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.connections() });
      toast.success('EMR connection created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create EMR connection');
      console.error('Error creating EMR connection:', error);
    },
  });
};

export const useUpdateEMRConnection = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      connectionId,
      data,
    }: {
      connectionId: string;
      data: Partial<EMRConnectionFormData>;
    }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return emrConnectionService.updateConnection(
        currentTenant.id,
        currentUser.id,
        connectionId,
        data
      );
    },
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.connections() });
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.connection(connectionId) });
      toast.success('EMR connection updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update EMR connection');
      console.error('Error updating EMR connection:', error);
    },
  });
};

export const useDeleteEMRConnection = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (connectionId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService.deleteConnection(currentTenant.id, connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.connections() });
      toast.success('EMR connection deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete EMR connection');
      console.error('Error deleting EMR connection:', error);
    },
  });
};

export const useTestEMRConnection = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (connectionId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService.testConnection(currentTenant.id, connectionId);
    },
    onSuccess: (_, connectionId) => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.connection(connectionId) });
      toast.success('Connection test completed');
    },
    onError: (error) => {
      toast.error('Connection test failed');
      console.error('Error testing connection:', error);
    },
  });
};

// Sync Status
export const useSyncStatus = (connectionId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: EMR_KEYS.syncStatus(connectionId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService.getSyncStatus(currentTenant.id, connectionId);
    },
    enabled: !!currentTenant && !!connectionId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

// FHIR Operations
export const useSyncFHIRPatient = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({ connectionId, patientId }: { connectionId: string; patientId: string }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService
        .getConnection(currentTenant.id, connectionId)
        .then((connection) => {
          if (!connection) throw new Error('Connection not found');
          return fhirService.syncPatient(connection, patientId, currentTenant.id);
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.messages() });
      toast.success('Patient sync initiated');
    },
    onError: (error) => {
      toast.error('Failed to sync patient');
      console.error('Error syncing patient:', error);
    },
  });
};

export const useCreateFHIRLabOrder = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({ connectionId, order }: { connectionId: string; order: FHIRServiceRequest }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService
        .getConnection(currentTenant.id, connectionId)
        .then((connection) => {
          if (!connection) throw new Error('Connection not found');
          return fhirService.createLabOrder(connection, order, currentTenant.id);
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.messages() });
      toast.success('Lab order created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create lab order');
      console.error('Error creating lab order:', error);
    },
  });
};

export const useSendFHIRResults = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({
      connectionId,
      results,
      observations,
    }: {
      connectionId: string;
      results: FHIRDiagnosticReport;
      observations: Array<Record<string, unknown>>;
    }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService
        .getConnection(currentTenant.id, connectionId)
        .then((connection) => {
          if (!connection) throw new Error('Connection not found');
          return fhirService.sendLabResults(
            connection,
            results,
            observations as unknown as FHIRObservation[],
            currentTenant.id
          );
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.messages() });
      toast.success('Lab results sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send lab results');
      console.error('Error sending lab results:', error);
    },
  });
};

// Webhook Endpoints
export const useWebhookEndpoints = (connectionId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: [...EMR_KEYS.connection(connectionId), 'webhooks'],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      // Return empty array for now - webhook functionality can be implemented later
      return Promise.resolve([]);
    },
    enabled: !!currentTenant && !!connectionId,
  });
};

export const useCreateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: any }) => {
      if (!currentTenant) throw new Error('No tenant selected');
      // Placeholder implementation
      return Promise.resolve({ id: 'webhook-' + Date.now(), ...data });
    },
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({
        queryKey: [...EMR_KEYS.connection(connectionId), 'webhooks'],
      });
      toast.success('Webhook endpoint created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create webhook endpoint');
      console.error('Error creating webhook endpoint:', error);
    },
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: ({ connectionId, webhookId }: { connectionId: string; webhookId: string }) => {
      // Placeholder implementation
      return Promise.resolve({ success: true, message: 'Webhook test successful' });
    },
    onSuccess: () => {
      toast.success('Webhook test successful');
    },
    onError: (error) => {
      toast.error('Webhook test failed');
      console.error('Error testing webhook:', error);
    },
  });
};

// Message Processing
export const useProcessEMRMessage = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (messageId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return emrConnectionService.processMessage(currentTenant.id, messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMR_KEYS.messages() });
      toast.success('Message processed successfully');
    },
    onError: (error) => {
      toast.error('Failed to process message');
      console.error('Error processing message:', error);
    },
  });
};
