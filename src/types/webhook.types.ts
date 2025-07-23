// Webhook types for EMR Integration

export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  connectionId: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  lastPingAt?: Date;
  lastPingStatus?: 'success' | 'failed';
  metadata?: Record<string, unknown>;
}

export type WebhookEventType = 
  | 'patient.created'
  | 'patient.updated'
  | 'patient.merged'
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'result.available'
  | 'result.amended'
  | 'result.final'
  | 'appointment.scheduled'
  | 'appointment.cancelled'
  | 'document.received';

export interface WebhookEvent {
  id: string;
  tenantId: string;
  endpointId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  signature: string;
  timestamp: Date;
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  status: WebhookEventStatus;
  response?: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
}

export type WebhookEventStatus = 
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'expired';

export interface WebhookDeliveryAttempt {
  id: string;
  eventId: string;
  attemptNumber: number;
  timestamp: Date;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  success: boolean;
}

export interface WebhookSignatureVerification {
  algorithm: 'HMAC-SHA256' | 'HMAC-SHA512';
  header: string;
  format: 'hex' | 'base64';
}

export interface WebhookRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface WebhookEndpointFormData {
  connectionId: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  isActive: boolean;
}

export interface WebhookTestPayload {
  eventType: WebhookEventType;
  sampleData?: Record<string, unknown>;
}

export interface WebhookMetrics {
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  eventsByType: Record<WebhookEventType, number>;
  last24Hours: {
    hour: string;
    events: number;
    successes: number;
    failures: number;
  }[];
}