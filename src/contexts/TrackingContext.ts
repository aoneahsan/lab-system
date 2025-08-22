import { createContext, useContext } from 'react';
import { logger } from '@/services/logger.service';

interface TrackingContextType {
  trackEvent: (eventName: string, properties?: any) => Promise<void>;
  trackPageView: (pageName?: string, properties?: any) => Promise<void>;
  setUser: (userId: string, traits?: any) => Promise<void>;
  clearUser: () => Promise<void>;
}

const trackingInstance = {
  trackEvent: async (eventName: string, properties?: any) => {
    logger.log('Event tracked:', eventName, properties);
  },
  trackPageView: async (pageName?: string, properties?: any) => {
    logger.log('Page view tracked:', pageName, properties);
  },
  setUser: async (userId: string, traits?: any) => {
    logger.log('User set:', userId, traits);
  },
  clearUser: async () => {
    logger.log('User cleared');
  }
};

export const TrackingContext = createContext<TrackingContextType>(trackingInstance);

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

export { trackingInstance };