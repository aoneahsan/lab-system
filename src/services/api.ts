/**
 * API Service
 * Base configuration for API calls with performance tracking
 */

import axios from 'axios';
import { auth } from '@/config/firebase.config';
import { trackingInstance } from '@/providers/TrackingProvider';
import { errorHandlerInstance } from '@/providers/ErrorHandlingProvider';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || '/api',
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
    config.metadata = {
      startTime: Date.now(),
      transactionId: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Track API request
    trackingInstance.trackEvent('api_request', {
      method: config.method,
      url: config.url,
      transactionId: config.metadata.transactionId,
    });

    return config;
  },
  (error) => {
    errorHandlerInstance.handleError(error, { context: 'api_request_interceptor' });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and performance tracking
api.interceptors.response.use(
  (response) => {
    // Track successful API response
    const duration = Date.now() - response.config.metadata?.startTime || 0;
    const endpoint = response.config.url || 'unknown';
    const method = response.config.method || 'unknown';

    trackingInstance.trackEvent('api_response', {
      method,
      url: endpoint,
      status: response.status,
      duration,
      transactionId: response.config.metadata?.transactionId,
    });

    trackingInstance.trackMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      status: response.status.toString(),
    });

    return response;
  },
  (error) => {
    // Track failed API response
    const duration = Date.now() - error.config?.metadata?.startTime || 0;
    const endpoint = error.config?.url || 'unknown';
    const method = error.config?.method || 'unknown';
    const status = error.response?.status || 0;

    trackingInstance.trackEvent('api_error', {
      method,
      url: endpoint,
      status,
      duration,
      error: error.message,
      transactionId: error.config?.metadata?.transactionId,
    });

    trackingInstance.trackMetric('api_error_rate', 1, 'count', {
      endpoint,
      method,
      status: status.toString(),
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
    errorHandlerInstance.handleError(error, {
      context: 'api_response_interceptor',
      endpoint,
      method,
      status,
    });

    return Promise.reject(error);
  }
);

export default api;
