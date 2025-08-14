/**
 * Permission Utility Functions
 * Non-React utility functions for permission checking
 */

import { Permission } from '../constants/permissions.constants';
import { getRolePermissions } from '../constants/role-permissions.constants';
import { UserRole } from '../types/auth.types';
import { User } from '../types/user.types';

/**
 * Check if a user has a specific permission
 */
export function checkPermission(
  user: User | null | undefined,
  permission: Permission | Permission[]
): boolean {
  if (!user) return false;
  
  // Super admin always has all permissions
  if (user.role === 'super_admin') return true;
  
  // Get user's permissions
  const userPermissions = getUserPermissions(user);
  
  // Check if it's an array of permissions (requires all)
  if (Array.isArray(permission)) {
    return permission.every(p => userPermissions.includes(p));
  }
  
  // Single permission check
  return userPermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function checkAnyPermission(
  user: User | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  
  // Super admin always has all permissions
  if (user.role === 'super_admin') return true;
  
  const userPermissions = getUserPermissions(user);
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function checkAllPermissions(
  user: User | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  
  // Super admin always has all permissions
  if (user.role === 'super_admin') return true;
  
  const userPermissions = getUserPermissions(user);
  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Get all permissions for a user (role + custom)
 */
export function getUserPermissions(user: User | null | undefined): Permission[] {
  if (!user?.role) return [];
  
  // Get role-based permissions
  const rolePermissions = getRolePermissions(user.role as UserRole);
  
  // Merge with custom permissions
  const customPermissions = user.permissions || [];
  
  // Combine and deduplicate
  return Array.from(new Set([...rolePermissions, ...customPermissions]));
}

/**
 * Check if a user can access a resource based on ownership
 */
export function checkResourceAccess(
  user: User | null | undefined,
  permission: Permission,
  resourceOwnerId?: string
): boolean {
  if (!user) return false;
  
  // Super admin always has access
  if (user.role === 'super_admin') return true;
  
  // Check base permission
  if (!checkPermission(user, permission)) return false;
  
  // If resource owner is specified, check ownership-based permissions
  if (resourceOwnerId) {
    // Check if permission is for "own" resources
    if (permission.includes('.own')) {
      return resourceOwnerId === user.uid;
    }
    
    // Check if permission is for "assigned" resources
    if (permission.includes('.assigned')) {
      // This would need to check assignment logic
      // Implementation depends on how assignments are stored
      return true;
    }
  }
  
  return true;
}

/**
 * Check if a user is an admin
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'lab_admin';
}

/**
 * Check if a user is medical staff
 */
export function isUserMedicalStaff(user: User | null | undefined): boolean {
  if (!user) return false;
  return ['pathologist', 'radiologist', 'clinician'].includes(user.role || '');
}

/**
 * Check if a user is lab staff
 */
export function isUserLabStaff(user: User | null | undefined): boolean {
  if (!user) return false;
  return ['lab_technician', 'phlebotomist'].includes(user.role || '');
}

/**
 * Filter a list of items based on user permissions
 */
export function filterByPermission<T>(
  items: T[],
  user: User | null | undefined,
  permissionGetter: (item: T) => Permission | Permission[] | undefined
): T[] {
  if (!user) return [];
  
  // Super admin sees everything
  if (user.role === 'super_admin') return items;
  
  return items.filter(item => {
    const requiredPermission = permissionGetter(item);
    if (!requiredPermission) return true;
    return checkPermission(user, requiredPermission);
  });
}

/**
 * Get permission error message
 */
export function getPermissionError(permission: Permission | Permission[]): string {
  if (Array.isArray(permission)) {
    return `You need the following permissions: ${permission.join(', ')}`;
  }
  return `You need the "${permission}" permission to perform this action.`;
}

/**
 * Check if permissions are sufficient for an action
 */
export function validatePermissions(
  user: User | null | undefined,
  required: {
    permission?: Permission | Permission[];
    anyPermission?: Permission[];
    allPermissions?: Permission[];
    requireAuth?: boolean;
    requireAdmin?: boolean;
    requireMedicalStaff?: boolean;
    requireLabStaff?: boolean;
  }
): { allowed: boolean; reason?: string } {
  // Check authentication
  if (required.requireAuth && !user) {
    return { allowed: false, reason: 'Authentication required' };
  }
  
  // Check admin requirement
  if (required.requireAdmin && !isUserAdmin(user)) {
    return { allowed: false, reason: 'Administrator access required' };
  }
  
  // Check medical staff requirement
  if (required.requireMedicalStaff && !isUserMedicalStaff(user) && !isUserAdmin(user)) {
    return { allowed: false, reason: 'Medical staff access required' };
  }
  
  // Check lab staff requirement
  if (required.requireLabStaff && !isUserLabStaff(user) && !isUserAdmin(user)) {
    return { allowed: false, reason: 'Lab staff access required' };
  }
  
  // Check specific permissions
  if (required.permission && !checkPermission(user, required.permission)) {
    return { allowed: false, reason: getPermissionError(required.permission) };
  }
  
  // Check any permission
  if (required.anyPermission && !checkAnyPermission(user, required.anyPermission)) {
    return { 
      allowed: false, 
      reason: `You need at least one of: ${required.anyPermission.join(', ')}` 
    };
  }
  
  // Check all permissions
  if (required.allPermissions && !checkAllPermissions(user, required.allPermissions)) {
    return { 
      allowed: false, 
      reason: `You need all of: ${required.allPermissions.join(', ')}` 
    };
  }
  
  return { allowed: true };
}

/**
 * Format permission name for display
 */
export function formatPermissionName(permission: Permission): string {
  return permission
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/_/g, ' ');
}

/**
 * Group permissions by module
 */
export function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  
  permissions.forEach(permission => {
    const module = permission.split('.')[0].toUpperCase();
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(permission);
  });
  
  return grouped;
}