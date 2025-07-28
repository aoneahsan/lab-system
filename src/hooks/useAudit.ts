import { useCallback } from 'react';
import { auditService } from '../services/audit';
import type { AuditAction, AuditResource } from '../services/audit';

export const useAudit = () => {
  const logAction = useCallback(
    async (action: AuditAction, resource: AuditResource, resourceId?: string, details?: any) => {
      await auditService.log(action, resource, resourceId, details);
    },
    []
  );

  const logError = useCallback(
    async (action: AuditAction, resource: AuditResource, error: any, resourceId?: string) => {
      await auditService.log(
        action,
        resource,
        resourceId,
        { error: error.message },
        false,
        error.message
      );
    },
    []
  );

  const withAudit = useCallback(
    async <T>(
      action: AuditAction,
      resource: AuditResource,
      resourceId: string | undefined,
      operation: () => Promise<T>
    ): Promise<T> => {
      try {
        const result = await operation();
        await logAction(action, resource, resourceId, { success: true });
        return result;
      } catch (error) {
        await logError(action, resource, error, resourceId);
        throw error;
      }
    },
    [logAction, logError]
  );

  return {
    logAction,
    logError,
    withAudit,
    // Convenience methods
    logCreate: (resource: AuditResource, resourceId: string, data?: any) =>
      logAction('CREATE', resource, resourceId, data),
    logUpdate: (resource: AuditResource, resourceId: string, changes?: any) =>
      logAction('UPDATE', resource, resourceId, changes),
    logDelete: (resource: AuditResource, resourceId: string) =>
      logAction('DELETE', resource, resourceId),
    logAccess: (resource: AuditResource, resourceId: string) =>
      logAction('READ', resource, resourceId),
    logExport: (resource: AuditResource, format: string, count: number) =>
      logAction('EXPORT', resource, undefined, { format, count }),
    logPrint: (resource: AuditResource, resourceId: string) =>
      logAction('PRINT', resource, resourceId),
  };
};
