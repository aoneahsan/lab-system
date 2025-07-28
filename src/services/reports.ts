import { api } from './api';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportGenerationRequest {
  templateId?: string | null;
  filters: any;
  format: 'pdf' | 'excel' | 'csv';
}

export const reportService = {
  // Get available report templates
  async getTemplates(): Promise<ReportTemplate[]> {
    const response = await api.get('/api/reports/templates');
    return response.data;
  },

  // Generate a report
  async generateReport(request: ReportGenerationRequest): Promise<Blob> {
    const response = await api.post('/api/reports/generate', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Save a custom report template
  async saveTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const response = await api.post('/api/reports/templates', template);
    return response.data;
  },

  // Get report history
  async getHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<any[]> {
    const response = await api.get('/api/reports/history', { params: filters });
    return response.data;
  },

  // Schedule a report
  async scheduleReport(schedule: {
    templateId: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: string;
  }): Promise<any> {
    const response = await api.post('/api/reports/schedule', schedule);
    return response.data;
  },
};
