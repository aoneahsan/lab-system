import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  initialize(userId?: string) {
    if (this.isInitialized) return;

    this.userId = userId || null;
    this.isInitialized = true;

    // Initialize Google Analytics
    if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID && window.gtag) {
      window.gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID, {
        user_id: userId,
        session_id: this.sessionId
      });
    }

    logger.info('Analytics initialized', { userId, sessionId: this.sessionId });
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;

    // Update Google Analytics user ID
    if (window.gtag) {
      window.gtag('set', { user_id: userId });
      
      if (traits) {
        window.gtag('set', 'user_properties', traits);
      }
    }

    logger.info('User identified', { userId, traits });
  }

  track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      category: this.categorizeEvent(eventName),
      properties: {
        ...properties,
        session_id: this.sessionId
      },
      userId: this.userId || undefined,
      timestamp: new Date()
    };

    this.events.push(event);

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: event.category,
        ...event.properties
      });
    }

    logger.debug('Event tracked', event);
  }

  page(pageName: string, properties?: Record<string, any>) {
    const pageProperties = {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...properties
    };

    this.track('page_view', pageProperties);

    // Send page view to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', pageProperties);
    }
  }

  timing(category: string, variable: string, value: number, label?: string) {
    this.track('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_value: value,
      timing_label: label
    });

    // Send timing to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: Math.round(value),
        event_category: category,
        event_label: label
      });
    }
  }

  exception(description: string, fatal = false) {
    this.track('exception', {
      description,
      fatal
    });

    // Send exception to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description,
        fatal
      });
    }

    logger.error('Exception tracked', { description, fatal });
  }

  private categorizeEvent(eventName: string): string {
    const categories: Record<string, string[]> = {
      auth: ['login', 'logout', 'signup', 'password_reset'],
      patient: ['patient_created', 'patient_updated', 'patient_viewed'],
      test: ['test_ordered', 'test_completed', 'test_cancelled'],
      sample: ['sample_collected', 'sample_processed', 'sample_stored'],
      result: ['result_entered', 'result_validated', 'result_reported'],
      billing: ['invoice_created', 'payment_received', 'claim_submitted'],
      ui: ['button_clicked', 'form_submitted', 'modal_opened']
    };

    for (const [category, events] of Object.entries(categories)) {
      if (events.some(e => eventName.toLowerCase().includes(e))) {
        return category;
      }
    }

    return 'general';
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

export const analytics = new Analytics();