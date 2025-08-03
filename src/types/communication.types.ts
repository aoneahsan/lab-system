export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'sms' | 'whatsapp' | 'email' | 'push';
  isActive: boolean;
  configuration: {
    // SMS Configuration
    smsProvider?: 'twilio' | 'sendgrid' | 'aws_sns';
    smsApiKey?: string;
    smsPhoneNumber?: string;
    
    // WhatsApp Configuration
    whatsappBusinessId?: string;
    whatsappAccessToken?: string;
    whatsappPhoneNumber?: string;
    
    // Email Configuration
    emailProvider?: 'sendgrid' | 'aws_ses' | 'smtp';
    emailApiKey?: string;
    emailFromAddress?: string;
    emailFromName?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    
    // Push Notification Configuration
    pushProvider?: 'firebase' | 'onesignal';
    pushApiKey?: string;
    pushAppId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'appointment' | 'result' | 'billing' | 'marketing' | 'general';
  channels: ('sms' | 'whatsapp' | 'email' | 'push')[];
  
  // Template content for each channel
  content: {
    sms?: {
      body: string;
      variables: string[];
    };
    whatsapp?: {
      body: string;
      mediaUrl?: string;
      variables: string[];
      buttons?: Array<{
        type: 'quick_reply' | 'url' | 'phone';
        text: string;
        payload?: string;
      }>;
    };
    email?: {
      subject: string;
      body: string; // HTML content
      plainText?: string;
      variables: string[];
      attachments?: Array<{
        type: 'pdf' | 'image';
        url?: string;
        generateFrom?: string; // e.g., 'result_report', 'invoice'
      }>;
    };
    push?: {
      title: string;
      body: string;
      imageUrl?: string;
      variables: string[];
      data?: Record<string, any>;
    };
  };
  
  // Trigger conditions
  triggers?: {
    event?: 'appointment_created' | 'appointment_reminder' | 'result_ready' | 'payment_due' | 'custom';
    timing?: {
      type: 'immediate' | 'scheduled' | 'relative';
      value?: number; // minutes for relative timing
      scheduleTime?: string; // HH:mm for scheduled
    };
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'one_time' | 'recurring' | 'automated';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  
  // Target audience
  audience: {
    type: 'all' | 'segment' | 'individual';
    segmentRules?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    individualIds?: string[];
    estimatedCount?: number;
  };
  
  // Message configuration
  templateId: string;
  channels: ('sms' | 'whatsapp' | 'email' | 'push')[];
  
  // Scheduling
  schedule: {
    startDate: Date;
    endDate?: Date;
    frequency?: 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:mm
    daysOfWeek?: number[]; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  
  // Performance tracking
  metrics: {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    optedOut: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
  tenantId: string;
}

export interface Message {
  id: string;
  campaignId?: string;
  templateId: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'push';
  
  // Recipient information
  recipient: {
    id: string;
    type: 'patient' | 'user' | 'contact';
    name: string;
    phone?: string;
    email?: string;
    deviceToken?: string;
  };
  
  // Message content (after variable replacement)
  content: {
    subject?: string; // For email
    body: string;
    mediaUrl?: string; // For WhatsApp
    attachments?: string[]; // For email
  };
  
  // Delivery status
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'unsubscribed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  
  // Tracking
  clickedLinks?: Array<{
    url: string;
    clickedAt: Date;
  }>;
  
  // Provider information
  providerMessageId?: string;
  providerStatus?: string;
  
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface CommunicationPreferences {
  id: string;
  userId: string;
  userType: 'patient' | 'user';
  
  // Channel preferences
  channels: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    push: boolean;
  };
  
  // Category preferences
  categories: {
    appointment: boolean;
    result: boolean;
    billing: boolean;
    marketing: boolean;
    general: boolean;
  };
  
  // Timing preferences
  timing: {
    doNotDisturbStart?: string; // HH:mm
    doNotDisturbEnd?: string; // HH:mm
    timezone?: string;
    preferredDays?: number[]; // 0-6
  };
  
  // Language preference
  language: string;
  
  // Opt-out status
  optedOut: boolean;
  optOutDate?: Date;
  optOutReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface MessageLog {
  id: string;
  messageId: string;
  timestamp: Date;
  event: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'unsubscribed';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Analytics types
export interface CommunicationAnalytics {
  date: Date;
  channel: 'sms' | 'whatsapp' | 'email' | 'push';
  
  // Volume metrics
  sent: number;
  delivered: number;
  deliveryRate: number;
  
  // Engagement metrics
  opened: number;
  openRate: number;
  clicked: number;
  clickRate: number;
  
  // Error metrics
  failed: number;
  bounced: number;
  unsubscribed: number;
  
  // Cost metrics (if applicable)
  cost?: number;
  costPerMessage?: number;
}

// Form types
export interface MessageTemplateFormData {
  name: string;
  description: string;
  category: MessageTemplate['category'];
  channels: MessageTemplate['channels'];
  content: MessageTemplate['content'];
  triggers?: MessageTemplate['triggers'];
  isActive: boolean;
}

export interface CampaignFormData {
  name: string;
  description: string;
  type: Campaign['type'];
  templateId: string;
  channels: Campaign['channels'];
  audience: Campaign['audience'];
  schedule: Campaign['schedule'];
}