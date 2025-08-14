/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { Permission } from '../../constants/permissions.constants';
import { usePermissions } from '../../hooks/usePermissions';
import { Alert, AlertDescription } from '../ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  // Permission(s) required to render children
  permission?: Permission | Permission[];
  
  // Alternative: Check if user has any of these permissions
  anyPermission?: Permission[];
  
  // Alternative: Check if user has all of these permissions
  allPermissions?: Permission[];
  
  // Resource owner ID for ownership-based checks
  resourceOwnerId?: string;
  
  // Children to render if permission check passes
  children: React.ReactNode;
  
  // Fallback to render if permission check fails
  fallback?: React.ReactNode;
  
  // Show default unauthorized message if no fallback provided
  showUnauthorized?: boolean;
  
  // Custom unauthorized message
  unauthorizedMessage?: string;
  
  // Hide content completely if unauthorized (no fallback)
  hideIfUnauthorized?: boolean;
  
  // Require authentication only (no specific permission)
  requireAuth?: boolean;
  
  // Require admin role
  requireAdmin?: boolean;
  
  // Require medical staff role
  requireMedicalStaff?: boolean;
  
  // Require lab staff role
  requireLabStaff?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyPermission,
  allPermissions,
  resourceOwnerId,
  children,
  fallback,
  showUnauthorized = true,
  unauthorizedMessage = 'You do not have permission to access this content.',
  hideIfUnauthorized = false,
  requireAuth = false,
  requireAdmin = false,
  requireMedicalStaff = false,
  requireLabStaff = false,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isAuthenticated,
    isAdmin,
    isMedicalStaff,
    isLabStaff,
  } = usePermissions();
  
  // Determine if access is granted
  let hasAccess = false;
  
  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    hasAccess = false;
  }
  // Check admin requirement
  else if (requireAdmin) {
    hasAccess = isAdmin;
  }
  // Check medical staff requirement
  else if (requireMedicalStaff) {
    hasAccess = isMedicalStaff || isAdmin;
  }
  // Check lab staff requirement
  else if (requireLabStaff) {
    hasAccess = isLabStaff || isAdmin;
  }
  // Check specific permissions
  else if (permission) {
    if (resourceOwnerId) {
      // Check with resource ownership
      hasAccess = Array.isArray(permission)
        ? permission.every(p => canAccess(p, resourceOwnerId))
        : canAccess(permission, resourceOwnerId);
    } else {
      // Standard permission check
      hasAccess = hasPermission(permission);
    }
  }
  // Check any permission requirement
  else if (anyPermission) {
    hasAccess = hasAnyPermission(anyPermission);
  }
  // Check all permissions requirement
  else if (allPermissions) {
    hasAccess = hasAllPermissions(allPermissions);
  }
  // If only requireAuth is true
  else if (requireAuth) {
    hasAccess = isAuthenticated;
  }
  // No requirements specified, grant access
  else {
    hasAccess = true;
  }
  
  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Handle unauthorized access
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (hideIfUnauthorized) {
    return null;
  }
  
  if (showUnauthorized) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {unauthorizedMessage}
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

/**
 * HOC version of PermissionGate for wrapping components
 */
export function withPermissionGate<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<PermissionGateProps, 'children'>
) {
  return (props: P) => (
    <PermissionGate {...options}>
      <Component {...props} />
    </PermissionGate>
  );
}

/**
 * Utility component for showing/hiding UI elements based on permissions
 */
export const PermissionShow: React.FC<{
  permission: Permission | Permission[];
  children: React.ReactNode;
}> = ({ permission, children }) => (
  <PermissionGate permission={permission} hideIfUnauthorized>
    {children}
  </PermissionGate>
);

/**
 * Utility component for admin-only content
 */
export const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionGate requireAdmin hideIfUnauthorized>
    {children}
  </PermissionGate>
);

/**
 * Utility component for authenticated-only content
 */
export const AuthOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionGate requireAuth hideIfUnauthorized>
    {children}
  </PermissionGate>
);