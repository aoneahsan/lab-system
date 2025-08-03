import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenant.store';
import { FIREBASE_COLLECTIONS } from '@/config/firebase-collections';
import type {
  CommunicationChannel,
  MessageTemplate,
  Campaign,
  Message,
  CommunicationPreferences,
  MessageTemplateFormData,
  CampaignFormData
} from '@/types/communication.types';

const getCollectionName = (collectionName: string) => {
  const tenantPrefix = useTenantStore.getState().currentTenant?.firebasePrefix || 'labflow_';
  return `${tenantPrefix}${collectionName}`;
};

// Communication Channels
export const channelService = {
  async createChannel(data: Partial<CommunicationChannel>): Promise<string> {
    const channelsCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_CHANNELS));
    const channelDoc = doc(channelsCollection);
    
    const channel: CommunicationChannel = {
      id: channelDoc.id,
      name: data.name || '',
      type: data.type || 'email',
      isActive: data.isActive ?? true,
      configuration: data.configuration || {},
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(channelDoc, channel);
    return channelDoc.id;
  },

  async updateChannel(id: string, data: Partial<CommunicationChannel>): Promise<void> {
    const channelRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_CHANNELS), id);
    await updateDoc(channelRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async getChannels(): Promise<CommunicationChannel[]> {
    const channelsQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_CHANNELS)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(channelsQuery);
    return snapshot.docs.map(doc => doc.data() as CommunicationChannel);
  },

  async getActiveChannels(type?: CommunicationChannel['type']): Promise<CommunicationChannel[]> {
    let channelsQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_CHANNELS)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      where('isActive', '==', true)
    );

    if (type) {
      channelsQuery = query(channelsQuery, where('type', '==', type));
    }
    
    const snapshot = await getDocs(channelsQuery);
    return snapshot.docs.map(doc => doc.data() as CommunicationChannel);
  }
};

// Message Templates
export const templateService = {
  async createTemplate(data: MessageTemplateFormData): Promise<string> {
    const templatesCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGE_TEMPLATES));
    const templateDoc = doc(templatesCollection);
    
    const template: MessageTemplate = {
      id: templateDoc.id,
      ...data,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: '',
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(templateDoc, template);
    return templateDoc.id;
  },

  async updateTemplate(id: string, data: Partial<MessageTemplateFormData>): Promise<void> {
    const templateRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGE_TEMPLATES), id);
    await updateDoc(templateRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async deleteTemplate(id: string): Promise<void> {
    const templateRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGE_TEMPLATES), id);
    await deleteDoc(templateRef);
  },

  async getTemplate(id: string): Promise<MessageTemplate | null> {
    const templateRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGE_TEMPLATES), id);
    const templateSnap = await getDoc(templateRef);
    return templateSnap.exists() ? templateSnap.data() as MessageTemplate : null;
  },

  async getTemplates(category?: MessageTemplate['category']): Promise<MessageTemplate[]> {
    let templatesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGE_TEMPLATES)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || '')
    );

    if (category) {
      templatesQuery = query(templatesQuery, where('category', '==', category));
    }

    templatesQuery = query(templatesQuery, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(templatesQuery);
    return snapshot.docs.map(doc => doc.data() as MessageTemplate);
  }
};

// Campaigns
export const campaignService = {
  async createCampaign(data: CampaignFormData): Promise<string> {
    const campaignsCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.CAMPAIGNS));
    const campaignDoc = doc(campaignsCollection);
    
    const campaign: Campaign = {
      id: campaignDoc.id,
      ...data,
      status: 'draft',
      metrics: {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        optedOut: 0
      },
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: '',
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(campaignDoc, campaign);
    return campaignDoc.id;
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<void> {
    const campaignRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.CAMPAIGNS), id);
    await updateDoc(campaignRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async getCampaign(id: string): Promise<Campaign | null> {
    const campaignRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.CAMPAIGNS), id);
    const campaignSnap = await getDoc(campaignRef);
    return campaignSnap.exists() ? campaignSnap.data() as Campaign : null;
  },

  async getCampaigns(status?: Campaign['status']): Promise<Campaign[]> {
    let campaignsQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.CAMPAIGNS)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || '')
    );

    if (status) {
      campaignsQuery = query(campaignsQuery, where('status', '==', status));
    }

    campaignsQuery = query(campaignsQuery, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(campaignsQuery);
    return snapshot.docs.map(doc => doc.data() as Campaign);
  },

  async startCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, {
      status: 'running',
      lastRunAt: new Date()
    });
  },

  async pauseCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, {
      status: 'paused'
    });
  },

  async completeCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, {
      status: 'completed'
    });
  }
};

// Messages
export const messageService = {
  async sendMessage(data: {
    templateId: string;
    channel: Message['channel'];
    recipientId: string;
    recipientType: Message['recipient']['type'];
    variables?: Record<string, string>;
    campaignId?: string;
  }): Promise<string> {
    const messagesCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGES));
    const messageDoc = doc(messagesCollection);
    
    // Get template
    const template = await templateService.getTemplate(data.templateId);
    if (!template) throw new Error('Template not found');

    // Get recipient details (simplified for now)
    const recipient = {
      id: data.recipientId,
      type: data.recipientType,
      name: 'Recipient Name', // Would be fetched from patient/user service
      phone: '+1234567890',
      email: 'recipient@example.com'
    };

    // Process template content with variables
    const content = template.content[data.channel];
    if (!content) throw new Error(`Template does not support ${data.channel} channel`);

    // Replace variables in content (simplified)
    let processedBody = content.body;
    if (data.variables) {
      Object.entries(data.variables).forEach(([key, value]) => {
        processedBody = processedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    const message: Message = {
      id: messageDoc.id,
      campaignId: data.campaignId,
      templateId: data.templateId,
      channel: data.channel,
      recipient,
      content: {
        body: processedBody,
        subject: data.channel === 'email' ? (content as any).subject : undefined
      },
      status: 'pending',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(messageDoc, message);
    
    // Queue message for sending (would integrate with actual providers)
    // For now, just mark as sent after a delay
    setTimeout(async () => {
      await updateDoc(messageDoc, {
        status: 'sent',
        sentAt: serverTimestamp()
      });
    }, 1000);

    return messageDoc.id;
  },

  async getMessages(filters?: {
    campaignId?: string;
    recipientId?: string;
    channel?: Message['channel'];
    status?: Message['status'];
  }): Promise<Message[]> {
    let messagesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGES)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || '')
    );

    if (filters?.campaignId) {
      messagesQuery = query(messagesQuery, where('campaignId', '==', filters.campaignId));
    }
    if (filters?.recipientId) {
      messagesQuery = query(messagesQuery, where('recipient.id', '==', filters.recipientId));
    }
    if (filters?.channel) {
      messagesQuery = query(messagesQuery, where('channel', '==', filters.channel));
    }
    if (filters?.status) {
      messagesQuery = query(messagesQuery, where('status', '==', filters.status));
    }

    messagesQuery = query(messagesQuery, orderBy('createdAt', 'desc'), limit(100));
    
    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map(doc => doc.data() as Message);
  },

  async updateMessageStatus(id: string, status: Message['status'], details?: any): Promise<void> {
    const messageRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.MESSAGES), id);
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'delivered') updates.deliveredAt = serverTimestamp();
    if (status === 'read') updates.readAt = serverTimestamp();
    if (status === 'failed' && details) updates.failureReason = details;

    await updateDoc(messageRef, updates);
  }
};

// Communication Preferences
export const preferencesService = {
  async getPreferences(userId: string, userType: CommunicationPreferences['userType']): Promise<CommunicationPreferences | null> {
    const prefsQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_PREFERENCES)),
      where('userId', '==', userId),
      where('userType', '==', userType),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      limit(1)
    );
    
    const snapshot = await getDocs(prefsQuery);
    return snapshot.empty ? null : snapshot.docs[0].data() as CommunicationPreferences;
  },

  async updatePreferences(userId: string, userType: CommunicationPreferences['userType'], data: Partial<CommunicationPreferences>): Promise<void> {
    const existing = await this.getPreferences(userId, userType);
    
    if (existing) {
      const prefRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_PREFERENCES), existing.id);
      await updateDoc(prefRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      const prefsCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.COMMUNICATION_PREFERENCES));
      const prefDoc = doc(prefsCollection);
      
      const preferences: CommunicationPreferences = {
        id: prefDoc.id,
        userId,
        userType,
        channels: {
          sms: true,
          whatsapp: true,
          email: true,
          push: true
        },
        categories: {
          appointment: true,
          result: true,
          billing: true,
          marketing: true,
          general: true
        },
        timing: {},
        language: 'en',
        optedOut: false,
        ...data,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        tenantId: useTenantStore.getState().currentTenant?.id || ''
      };

      await setDoc(prefDoc, preferences);
    }
  },

  async optOut(userId: string, userType: CommunicationPreferences['userType'], reason?: string): Promise<void> {
    await this.updatePreferences(userId, userType, {
      optedOut: true,
      optOutDate: new Date(),
      optOutReason: reason
    });
  }
};