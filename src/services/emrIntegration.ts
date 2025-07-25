import { api } from './api';
import { Test } from '../types';

export interface EMRPatient {
  mrn: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface EMROrder {
  orderNumber: string;
  patientMRN: string;
  tests: Array<{
    code?: string;
    name: string;
  }>;
  priority: string;
  orderingProvider?: string;
  diagnosis?: string;
  notes?: string;
}

export interface EMRIntegrationConfig {
  apiKey: string;
  serverUrl: string;
  emrSystem?: string;
}

export const emrIntegrationService = {
  // Test connection
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await api.post('/api/emr-integration/test', {}, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },

  // Import patient from EMR
  async importPatient(patient: EMRPatient, emrSystem?: string): Promise<any> {
    const response = await api.post('/api/emr-integration/patient', patient, {
      headers: {
        'X-EMR-System': emrSystem || 'unknown'
      }
    });
    return response.data;
  },

  // Import order from EMR
  async importOrder(order: EMROrder, emrSystem?: string): Promise<any> {
    const response = await api.post('/api/emr-integration/order', order, {
      headers: {
        'X-EMR-System': emrSystem || 'unknown'
      }
    });
    return response.data;
  },

  // Map EMR test codes to internal test catalog
  async mapTestCodes(tests: Array<{ code?: string; name: string }>): Promise<Test[]> {
    const response = await api.post('/api/emr-integration/map-tests', { tests });
    return response.data;
  },

  // Generate API key for extension
  async generateApiKey(userId: string): Promise<string> {
    const response = await api.post('/api/emr-integration/generate-key', { userId });
    return response.data.apiKey;
  },

  // Revoke API key
  async revokeApiKey(apiKey: string): Promise<void> {
    await api.post('/api/emr-integration/revoke-key', { apiKey });
  },

  // Get integration logs
  async getIntegrationLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    emrSystem?: string;
    status?: string;
  }): Promise<any[]> {
    const response = await api.get('/api/emr-integration/logs', { params: filters });
    return response.data;
  }
};