import { logger } from '@/services/monitoring/logger';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export interface Webhook {
  id?: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export class WebhookService {
  private readonly COLLECTION = 'labflow_webhooks';
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;

  async registerWebhook(webhook: Omit<Webhook, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...webhook,
        createdAt: new Date()
      });
      
      logger.info('Webhook registered', { id: docRef.id, name: webhook.name });
      return docRef.id;
    } catch (error) {
      logger.error('Failed to register webhook', error);
      throw error;
    }
  }

  async triggerWebhooks(event: WebhookEvent): Promise<void> {
    try {
      const webhooks = await this.getActiveWebhooks(event.type);
      
      await Promise.all(
        webhooks.map(webhook => this.sendWebhook(webhook, event))
      );
    } catch (error) {
      logger.error('Failed to trigger webhooks', error);
    }
  }

  private async getActiveWebhooks(eventType: string): Promise<Webhook[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where('active', '==', true),
      where('events', 'array-contains', eventType)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Webhook));
  }

  private async sendWebhook(webhook: Webhook, event: WebhookEvent): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.RETRY_ATTEMPTS) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LabFlow-Event': event.type,
            'X-LabFlow-Timestamp': event.timestamp.toISOString(),
            ...webhook.headers
          },
          body: JSON.stringify(event)
        });

        if (response.ok) {
          logger.info('Webhook sent successfully', { 
            webhookId: webhook.id, 
            event: event.type 
          });
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        attempt++;
        logger.warn(`Webhook attempt ${attempt} failed`, { 
          webhookId: webhook.id, 
          error 
        });
        
        if (attempt < this.RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }
    
    logger.error('Webhook failed after all retries', { 
      webhookId: webhook.id, 
      event: event.type 
    });
  }
}

export const webhookService = new WebhookService();