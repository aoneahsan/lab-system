import { api } from './api';
import { useAuthStore } from '@/stores/auth.store';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'EXPORT'
  | 'IMPORT'
  | 'PRINT'
  | 'APPROVE'
  | 'REJECT'
  | 'VERIFY'
  | 'ACKNOWLEDGE'
  | 'ACCESS_DENIED';

export type AuditResource =
  | 'patient'
  | 'test'
  | 'sample'
  | 'result'
  | 'order'
  | 'billing'
  | 'report'
  | 'user'
  | 'settings'
  | 'qc'
  | 'inventory'
  | 'equipment';

class AuditService {
  // Log an audit event
  async log(
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    details?: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const user = useAuthStore.getState().currentUser;
      if (!user) return;

      const auditLog: Partial<AuditLog> = {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action,
        resource,
        resourceId,
        details,
        timestamp: new Date(),
        success,
        errorMessage,
        userAgent: navigator.userAgent,
      };

      await api.post('/api/audit', auditLog);
    } catch (error) {
      // Don't throw errors from audit logging
      console.error('Failed to log audit event:', error);
    }
  }

  // Search audit logs
  async search(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const response = await api.get('/api/audit', { params: filters });
    return response.data;
  }

  // Get audit log by ID
  async getById(id: string): Promise<AuditLog> {
    const response = await api.get(`/api/audit/${id}`);
    return response.data;
  }

  // Get user activity
  async getUserActivity(userId: string, days: number = 30): Promise<AuditLog[]> {
    const response = await api.get(`/api/audit/user/${userId}`, {
      params: { days },
    });
    return response.data;
  }

  // Get resource history
  async getResourceHistory(resource: AuditResource, resourceId: string): Promise<AuditLog[]> {
    const response = await api.get(`/api/audit/resource/${resource}/${resourceId}`);
    return response.data;
  }

  // Export audit logs
  async export(filters: any, format: 'csv' | 'pdf' | 'excel'): Promise<Blob> {
    const response = await api.post('/api/audit/export', filters, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // Common audit methods for convenience
  async logLogin(success: boolean, details?: any): Promise<void> {
    await this.log('LOGIN', 'user', undefined, details, success);
  }

  async logLogout(): Promise<void> {
    await this.log('LOGOUT', 'user');
  }

  async logDataAccess(resource: AuditResource, resourceId: string, details?: any): Promise<void> {
    await this.log('READ', resource, resourceId, details);
  }

  async logDataModification(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: AuditResource,
    resourceId: string,
    changes?: any
  ): Promise<void> {
    await this.log(action, resource, resourceId, { changes });
  }

  async logExport(resource: AuditResource, format: string, recordCount: number): Promise<void> {
    await this.log('EXPORT', resource, undefined, { format, recordCount });
  }

  async logPrint(resource: AuditResource, resourceId: string): Promise<void> {
    await this.log('PRINT', resource, resourceId);
  }

  async logCriticalAction(
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    details: any
  ): Promise<void> {
    // Critical actions are always logged with additional details
    await this.log(action, resource, resourceId, {
      ...details,
      critical: true,
      timestamp: new Date().toISOString(),
    });
  }
}

export const auditService = new AuditService();
