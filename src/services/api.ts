/**
 * API Service
 * Base configuration for API calls with performance tracking
 */

import axios from 'axios';
import { auth } from '@/config/firebase.config';
import { trackingInstance } from '@/providers/TrackingProvider';
import { captureError } from 'unified-error-handling';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and track API calls
api.interceptors.request.use(
  async (config) => {
    // Add auth token
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Start performance tracking
    (config as any).metadata = {
      startTime: Date.now(),
      transactionId: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Track API request
    trackingInstance.trackEvent('api_request', {
      method: config.method,
      url: config.url,
      transactionId: (config as any).metadata.transactionId,
    });

    return config;
  },
  (error) => {
    captureError(error, { tags: { context: 'api_request_interceptor' } });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and performance tracking
api.interceptors.response.use(
  (response) => {
    // Track successful API response
    const duration = Date.now() - (response.config as any).metadata?.startTime || 0;
    const endpoint = response.config.url || 'unknown';
    const method = response.config.method || 'unknown';

    trackingInstance.trackEvent('api_response', {
      method,
      url: endpoint,
      status: response.status,
      duration,
      transactionId: (response.config as any).metadata?.transactionId,
    });

    trackingInstance.trackEvent('api_timing', {
      endpoint,
      method,
      status: response.status.toString(),
      duration,
    });

    return response;
  },
  (error) => {
    // Track failed API response
    const duration = Date.now() - (error.config as any)?.metadata?.startTime || 0;
    const endpoint = error.config?.url || 'unknown';
    const method = error.config?.method || 'unknown';
    const status = error.response?.status || 0;

    trackingInstance.trackEvent('api_error', {
      method,
      url: endpoint,
      status,
      duration,
      error: error.message,
      transactionId: (error.config as any)?.metadata?.transactionId,
    });

    trackingInstance.trackEvent('api_error_metric', {
      endpoint,
      method,
      status: status.toString(),
      count: 1,
    });

    // Handle specific errors
    if (error.response?.status === 401) {
      trackingInstance.trackEvent('auth_error', {
        type: 'unauthorized',
        url: endpoint,
      });
      window.location.href = '/login';
    }

    // Log error
    captureError(error, {
      tags: { context: 'api_response_interceptor' },
      extra: { endpoint, method, status }
    });

    return Promise.reject(error);
  }
);

export default api;
