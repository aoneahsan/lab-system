import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import type { 
  WebhookEndpoint,
  WebhookEndpointFormData,
  WebhookEvent,
  WebhookEventType,
  WebhookDeliveryAttempt,
  WebhookTestPayload,
  WebhookMetrics
} from '@/types/webhook.types';

class WebhookService {
  private readonly DEFAULT_RETRY_POLICY = {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2
  };

  // Endpoint CRUD operations
  async createEndpoint(
    tenantId: string,
    userId: string,
    data: WebhookEndpointFormData
  ): Promise<string> {
    // Generate a secure webhook secret if not provided
    const secret = data.secret || this.generateWebhookSecret();
    
    const endpoint = {
      tenantId,
      connectionId: data.connectionId,
      url: data.url,
      secret,
      events: data.events,
      isActive: data.isActive,
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    const endpointsRef = collection(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`);
    const docRef = doc(endpointsRef);
    await setDoc(docRef, endpoint);

    return docRef.id;
  }

  async updateEndpoint(
    tenantId: string,
    userId: string,
    endpointId: string,
    data: Partial<WebhookEndpointFormData>
  ): Promise<void> {
    const endpointRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`,
      endpointId
    );

    await updateDoc(endpointRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async deleteEndpoint(tenantId: string, endpointId: string): Promise<void> {
    const endpointRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`,
      endpointId
    );
    await deleteDoc(endpointRef);
  }

  async getEndpoint(tenantId: string, endpointId: string): Promise<WebhookEndpoint | null> {
    const endpointRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`,
      endpointId
    );
    const snapshot = await getDoc(endpointRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as WebhookEndpoint;
  }

  async getEndpointsByConnection(
    tenantId: string,
    connectionId: string
  ): Promise<WebhookEndpoint[]> {
    const endpointsRef = collection(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`
    );
    
    const q = query(
      endpointsRef,
      where('connectionId', '==', connectionId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as WebhookEndpoint));
  }

  // Webhook secret generation
  private generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  // Event handling
  async createEvent(
    tenantId: string,
    endpointId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>
  ): Promise<string> {
    const endpoint = await this.getEndpoint(tenantId, endpointId);
    if (!endpoint) throw new Error('Webhook endpoint not found');

    const timestamp = new Date();
    const signature = await this.generateSignature(endpoint.secret, payload, timestamp);

    const event: Omit<WebhookEvent, 'id'> = {
      tenantId,
      endpointId,
      eventType,
      payload,
      signature,
      timestamp,
      attempts: 0,
      status: 'pending',
    };

    const eventsRef = collection(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`);
    const docRef = doc(eventsRef);
    await setDoc(docRef, event);

    // Queue for delivery
    await this.queueEventDelivery(tenantId, docRef.id);

    return docRef.id;
  }

  // Signature generation
  private async generateSignature(
    secret: string,
    payload: Record<string, unknown>,
    timestamp: Date
  ): Promise<string> {
    const message = `${timestamp.getTime()}.${JSON.stringify(payload)}`;
    
    // Use Web Crypto API for HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `sha256=${signatureHex}`;
  }

  // Queue event for delivery
  private async queueEventDelivery(tenantId: string, eventId: string): Promise<void> {
    // In production, this would queue to a task queue or Firebase Functions
    // For now, we'll update the event to indicate it's ready for processing
    const eventRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`,
      eventId
    );

    await updateDoc(eventRef, {
      nextRetryAt: serverTimestamp(),
    });
  }

  // Test webhook endpoint
  async testEndpoint(
    tenantId: string,
    endpointId: string,
    testPayload: WebhookTestPayload
  ): Promise<boolean> {
    const endpoint = await this.getEndpoint(tenantId, endpointId);
    if (!endpoint) throw new Error('Webhook endpoint not found');

    const sampleData = testPayload.sampleData || this.getSampleData(testPayload.eventType);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': await this.generateSignature(
            endpoint.secret,
            sampleData,
            new Date()
          ),
          'X-Webhook-Event': testPayload.eventType,
          'X-Webhook-Timestamp': new Date().toISOString(),
        },
        body: JSON.stringify(sampleData),
      });

      // Update last ping status
      await updateDoc(
        doc(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`, endpointId),
        {
          lastPingAt: serverTimestamp(),
          lastPingStatus: response.ok ? 'success' : 'failed',
        }
      );

      return response.ok;
    } catch {
      await updateDoc(
        doc(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`, endpointId),
        {
          lastPingAt: serverTimestamp(),
          lastPingStatus: 'failed',
        }
      );
      return false;
    }
  }

  // Get sample data for event type
  private getSampleData(eventType: WebhookEventType): Record<string, unknown> {
    const samples: Record<WebhookEventType, Record<string, unknown>> = {
      'patient.created': {
        patient: {
          id: 'sample-patient-id',
          mrn: 'MRN123456',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
        },
      },
      'patient.updated': {
        patient: {
          id: 'sample-patient-id',
          mrn: 'MRN123456',
          changes: {
            phone: '+1234567890',
            email: 'john.doe@example.com',
          },
        },
      },
      'patient.merged': {
        primaryPatient: { id: 'primary-id', mrn: 'MRN123456' },
        mergedPatient: { id: 'merged-id', mrn: 'MRN789012' },
      },
      'order.created': {
        order: {
          id: 'sample-order-id',
          orderNumber: 'ORD-2024-001',
          patientId: 'sample-patient-id',
          tests: ['CBC', 'BMP', 'Lipid Panel'],
          priority: 'routine',
        },
      },
      'order.updated': {
        order: {
          id: 'sample-order-id',
          orderNumber: 'ORD-2024-001',
          changes: { status: 'in_progress' },
        },
      },
      'order.cancelled': {
        order: {
          id: 'sample-order-id',
          orderNumber: 'ORD-2024-001',
          reason: 'Duplicate order',
        },
      },
      'result.available': {
        result: {
          id: 'sample-result-id',
          orderId: 'sample-order-id',
          testCode: 'CBC',
          status: 'preliminary',
        },
      },
      'result.amended': {
        result: {
          id: 'sample-result-id',
          orderId: 'sample-order-id',
          amendment: 'Corrected WBC count',
        },
      },
      'result.final': {
        result: {
          id: 'sample-result-id',
          orderId: 'sample-order-id',
          testCode: 'CBC',
          status: 'final',
        },
      },
      'appointment.scheduled': {
        appointment: {
          id: 'sample-appointment-id',
          patientId: 'sample-patient-id',
          date: '2024-12-01',
          time: '14:00',
          type: 'Lab Draw',
        },
      },
      'appointment.cancelled': {
        appointment: {
          id: 'sample-appointment-id',
          reason: 'Patient request',
        },
      },
      'document.received': {
        document: {
          id: 'sample-document-id',
          type: 'Lab Report',
          patientId: 'sample-patient-id',
          receivedAt: new Date().toISOString(),
        },
      },
    };

    return samples[eventType] || {};
  }

  // Process and deliver webhook event
  async processWebhookEvent(tenantId: string, eventId: string): Promise<void> {
    const eventRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`,
      eventId
    );
    
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) return;
    
    const event = { id: eventDoc.id, ...eventDoc.data() } as WebhookEvent;
    
    // Check if event should be processed
    if (event.status !== 'pending' && event.status !== 'processing' && event.status !== 'failed') return;
    if (event.status === 'failed' && event.attempts >= this.DEFAULT_RETRY_POLICY.maxAttempts) {
      await updateDoc(eventRef, { status: 'expired' });
      return;
    }
    
    // Get endpoint
    const endpoint = await this.getEndpoint(tenantId, event.endpointId);
    if (!endpoint || !endpoint.isActive) {
      await updateDoc(eventRef, { 
        status: 'failed',
        error: 'Endpoint not found or inactive'
      });
      return;
    }
    
    // Update status to processing
    await updateDoc(eventRef, { 
      status: 'processing',
      lastAttemptAt: serverTimestamp()
    });
    
    try {
      // Deliver webhook
      const response = await this.deliverWebhook(endpoint, event);
      
      // Update event with success
      await updateDoc(eventRef, {
        status: 'delivered',
        attempts: event.attempts + 1,
        response: {
          statusCode: response.status,
          body: await response.text(),
          headers: Object.fromEntries(response.headers.entries()),
        },
      });
      
      // Record delivery attempt
      await this.recordDeliveryAttempt(tenantId, eventId, event.attempts + 1, true, response.status);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update event with failure
      const nextRetryAt = this.calculateNextRetryTime(event.attempts + 1);
      await updateDoc(eventRef, {
        status: event.attempts + 1 >= this.DEFAULT_RETRY_POLICY.maxAttempts ? 'failed' : 'pending',
        attempts: event.attempts + 1,
        error: errorMessage,
        nextRetryAt: nextRetryAt ? Timestamp.fromDate(nextRetryAt) : null,
      });
      
      // Record delivery attempt
      await this.recordDeliveryAttempt(tenantId, eventId, event.attempts + 1, false, undefined, errorMessage);
    }
  }
  
  // Deliver webhook to endpoint
  private async deliverWebhook(
    endpoint: WebhookEndpoint,
    event: WebhookEvent
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Id': event.id,
      'X-Webhook-Event': event.eventType,
      'X-Webhook-Signature': event.signature,
      'X-Webhook-Timestamp': event.timestamp.toISOString(),
    };
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(event.payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }
  
  // Calculate next retry time
  private calculateNextRetryTime(attemptNumber: number): Date | null {
    if (attemptNumber >= this.DEFAULT_RETRY_POLICY.maxAttempts) return null;
    
    let delay = this.DEFAULT_RETRY_POLICY.initialDelayMs * 
      Math.pow(this.DEFAULT_RETRY_POLICY.backoffMultiplier, attemptNumber - 1);
    
    delay = Math.min(delay, this.DEFAULT_RETRY_POLICY.maxDelayMs);
    
    return new Date(Date.now() + delay);
  }
  
  // Record delivery attempt
  private async recordDeliveryAttempt(
    tenantId: string,
    eventId: string,
    attemptNumber: number,
    success: boolean,
    statusCode?: number,
    error?: string
  ): Promise<void> {
    const attempt: Omit<WebhookDeliveryAttempt, 'id'> = {
      eventId,
      attemptNumber,
      timestamp: new Date(),
      success,
      statusCode,
      error,
    };
    
    const attemptsRef = collection(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_delivery_attempts`
    );
    await setDoc(doc(attemptsRef), attempt);
  }
  
  // Verify webhook signature
  async verifyWebhookSignature(
    secret: string,
    payload: string,
    signature: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      const expectedSignature = await this.generateSignature(
        secret,
        JSON.parse(payload),
        new Date(timestamp)
      );
      
      // Constant time comparison to prevent timing attacks
      if (signature.length !== expectedSignature.length) return false;
      
      let result = 0;
      for (let i = 0; i < signature.length; i++) {
        result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
      }
      
      return result === 0;
    } catch {
      return false;
    }
  }
  
  // Get pending webhook events for processing
  async getPendingWebhookEvents(tenantId: string): Promise<WebhookEvent[]> {
    const eventsRef = collection(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`);
    
    const q = query(
      eventsRef,
      where('status', 'in', ['pending', 'processing']),
      where('nextRetryAt', '<=', serverTimestamp()),
      orderBy('nextRetryAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as WebhookEvent));
  }

  // Get webhook metrics
  async getMetrics(
    tenantId: string,
    endpointId: string
  ): Promise<WebhookMetrics> {
    const eventsRef = collection(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`);
    
    // Get all events for this endpoint
    const q = query(
      eventsRef,
      where('endpointId', '==', endpointId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as WebhookEvent));

    // Calculate metrics
    const totalEvents = events.length;
    const successfulDeliveries = events.filter(e => e.status === 'delivered').length;
    const failedDeliveries = events.filter(e => e.status === 'failed').length;
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    events.forEach(event => {
      if (event.response && event.response.statusCode) {
        responseTimeCount++;
        // Estimate response time (would be tracked in real implementation)
        totalResponseTime += 100; // placeholder
      }
    });
    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

    // Events by type
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<WebhookEventType, number>);

    // Last 24 hours metrics
    const now = new Date();
    const last24Hours: WebhookMetrics['last24Hours'] = [];
    
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      
      const hourEvents = events.filter(e => 
        e.timestamp >= hourStart && e.timestamp < hourEnd
      );
      
      last24Hours.unshift({
        hour: hourStart.toISOString(),
        events: hourEvents.length,
        successes: hourEvents.filter(e => e.status === 'delivered').length,
        failures: hourEvents.filter(e => e.status === 'failed').length,
      });
    }

    return {
      totalEvents,
      successfulDeliveries,
      failedDeliveries,
      averageResponseTime,
      eventsByType,
      last24Hours,
    };
  }
  // Trigger webhook events for specific actions
  async triggerWebhookEvent(
    tenantId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>
  ): Promise<void> {
    // Get all active endpoints subscribed to this event type
    const endpointsRef = collection(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_endpoints`
    );
    
    const q = query(
      endpointsRef,
      where('isActive', '==', true),
      where('events', 'array-contains', eventType)
    );
    
    const snapshot = await getDocs(q);
    const endpoints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as WebhookEndpoint));
    
    // Create events for each endpoint
    const eventPromises = endpoints.map(endpoint =>
      this.createEvent(tenantId, endpoint.id, eventType, payload)
    );
    
    await Promise.all(eventPromises);
  }
  
  // Batch process webhook events
  async processWebhookBatch(tenantId: string): Promise<void> {
    const pendingEvents = await this.getPendingWebhookEvents(tenantId);
    
    // Process up to 10 events in parallel
    const batchSize = 10;
    for (let i = 0; i < pendingEvents.length; i += batchSize) {
      const batch = pendingEvents.slice(i, i + batchSize);
      await Promise.all(
        batch.map(event => this.processWebhookEvent(tenantId, event.id))
      );
    }
  }
  
  // Get event history for an endpoint
  async getEventHistory(
    tenantId: string,
    endpointId: string,
    limit = 50
  ): Promise<WebhookEvent[]> {
    const eventsRef = collection(db, `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`);
    
    const q = query(
      eventsRef,
      where('endpointId', '==', endpointId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as WebhookEvent));
    
    return events.slice(0, limit);
  }
  
  // Resend a webhook event
  async resendWebhookEvent(tenantId: string, eventId: string): Promise<void> {
    const eventRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/webhook_events`,
      eventId
    );
    
    // Reset event status for reprocessing
    await updateDoc(eventRef, {
      status: 'pending',
      nextRetryAt: serverTimestamp(),
      error: null,
    });
    
    // Process immediately
    await this.processWebhookEvent(tenantId, eventId);
  }
}

export const webhookService = new WebhookService();