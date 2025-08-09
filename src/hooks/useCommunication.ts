import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  channelService,
  templateService,
  campaignService,
  messageService,
  preferencesService
} from '@/services/communication.service';
import { toast } from '@/stores/toast.store';
import type {
  CommunicationChannel,
  MessageTemplate,
  Campaign,
  CommunicationPreferences,
  MessageTemplateFormData,
  CampaignFormData
} from '@/types/communication.types';

// Channel Hooks
export const useCommunicationChannels = () => {
  return useQuery({
    queryKey: ['communication-channels'],
    queryFn: () => channelService.getChannels(),
  });
};

export const useActiveChannels = (type?: CommunicationChannel['type']) => {
  return useQuery({
    queryKey: ['active-channels', type],
    queryFn: () => channelService.getActiveChannels(type),
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<CommunicationChannel>) => channelService.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-channels'] });
      toast.success('Success', 'Communication channel created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create channel');
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommunicationChannel> }) => 
      channelService.updateChannel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-channels'] });
      toast.success('Success', 'Communication channel updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update channel');
    },
  });
};

// Template Hooks
export const useMessageTemplates = (category?: MessageTemplate['category']) => {
  return useQuery({
    queryKey: ['message-templates', category],
    queryFn: () => templateService.getTemplates(category),
  });
};

export const useMessageTemplate = (id: string) => {
  return useQuery({
    queryKey: ['message-template', id],
    queryFn: () => templateService.getTemplate(id),
    enabled: !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MessageTemplateFormData) => templateService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Success', 'Message template created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create template');
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MessageTemplateFormData> }) => 
      templateService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Success', 'Message template updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update template');
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Success', 'Message template deleted successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to delete template');
    },
  });
};

// Campaign Hooks
export const useCampaigns = (status?: Campaign['status']) => {
  return useQuery({
    queryKey: ['campaigns', status],
    queryFn: () => campaignService.getCampaigns(status),
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignService.getCampaign(id),
    enabled: !!id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CampaignFormData) => campaignService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Success', 'Campaign created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create campaign');
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => 
      campaignService.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Success', 'Campaign updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update campaign');
    },
  });
};

export const useStartCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => campaignService.startCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Success', 'Campaign started successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to start campaign');
    },
  });
};

export const usePauseCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => campaignService.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Success', 'Campaign paused successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to pause campaign');
    },
  });
};

// Message Hooks
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof messageService.sendMessage>[0]) => 
      messageService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Success', 'Message sent successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to send message');
    },
  });
};

export const useMessages = (filters?: Parameters<typeof messageService.getMessages>[0]) => {
  return useQuery({
    queryKey: ['messages', filters],
    queryFn: () => messageService.getMessages(filters),
  });
};

// Preferences Hooks
export const useCommunicationPreferences = (userId: string, userType: CommunicationPreferences['userType']) => {
  return useQuery({
    queryKey: ['communication-preferences', userId, userType],
    queryFn: () => preferencesService.getPreferences(userId, userType),
    enabled: !!userId,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userType, data }: { 
      userId: string; 
      userType: CommunicationPreferences['userType']; 
      data: Partial<CommunicationPreferences> 
    }) => preferencesService.updatePreferences(userId, userType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-preferences'] });
      toast.success('Success', 'Communication preferences updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update preferences');
    },
  });
};

export const useOptOut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userType, reason }: { 
      userId: string; 
      userType: CommunicationPreferences['userType']; 
      reason?: string 
    }) => preferencesService.optOut(userId, userType, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-preferences'] });
      toast.success('Success', 'Successfully opted out of communications');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to opt out');
    },
  });
};