/**
 * Permission Hooks for LabFlow System
 * Provides React hooks for permission checking and management
 */

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Permission } from '../constants/permissions.constants';
import { getRolePermissions } from '../constants/role-permissions.constants';
import { UserRole } from '../types/auth.types';

/**
 * Main permission hook
 * Returns permission checking utilities for the current user
 */
export function usePermissions() {
  const { currentUser, impersonatingUser } = useAuthStore();
  
  // Use impersonated user if impersonation is active
  const activeUser = impersonatingUser || currentUser;
  
  // Get all permissions for the user's role
  const userPermissions = useMemo(() => {
    if (!activeUser?.role) return [];
    
    // Get role-based permissions
    const rolePermissions = getRolePermissions(activeUser.role as UserRole);
    
    // Merge with any custom permissions assigned to the user
    const customPermissions = activeUser.permissions || [];
    
    // Combine and deduplicate
    return Array.from(new Set([...rolePermissions, ...customPermissions]));
  }, [activeUser]);
  
  // Check if user has a specific permission
  const hasPermission = useCallback((permission: Permission | Permission[]): boolean => {
    if (!activeUser) return false;
    
    // Super admin always has all permissions
    if (activeUser.role === 'super_admin') return true;
    
    // Check if it's an array of permissions (requires all)
    if (Array.isArray(permission)) {
      return permission.every(p => userPermissions.includes(p));
    }
    
    // Single permission check
    return userPermissions.includes(permission);
  }, [activeUser, userPermissions]);
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!activeUser) return false;
    
    // Super admin always has all permissions
    if (activeUser.role === 'super_admin') return true;
    
    // Check if user has at least one permission
    return permissions.some(p => userPermissions.includes(p));
  }, [activeUser, userPermissions]);
  
  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!activeUser) return false;
    
    // Super admin always has all permissions
    if (activeUser.role === 'super_admin') return true;
    
    // Check if user has all permissions
    return permissions.every(p => userPermissions.includes(p));
  }, [activeUser, userPermissions]);
  
  // Check if user can perform an action on a resource
  const canAccess = useCallback((permission: Permission, resourceOwnerId?: string): boolean => {
    if (!activeUser) return false;
    
    // Super admin always has access
    if (activeUser.role === 'super_admin') return true;
    
    // Check base permission
    if (!hasPermission(permission)) return false;
    
    // If resource owner is specified, check ownership-based permissions
    if (resourceOwnerId) {
      // Check if permission is for "own" resources
      if (permission.includes('.own')) {
        return resourceOwnerId === activeUser.uid;
      }
      
      // Check if permission is for "assigned" resources
      if (permission.includes('.assigned')) {
        // This would need to check assignment logic
        // For now, we'll assume it's handled elsewhere
        return true;
      }
    }
    
    return true;
  }, [activeUser, hasPermission]);
  
  // Get user's role
  const userRole = activeUser?.role as UserRole | undefined;
  
  // Check if user is authenticated
  const isAuthenticated = !!activeUser;
  
  // Check if user is admin (lab_admin or super_admin)
  const isAdmin = activeUser?.role === 'super_admin' || activeUser?.role === 'lab_admin';
  
  // Check if user is medical staff (pathologist, radiologist, clinician)
  const isMedicalStaff = ['pathologist', 'radiologist', 'clinician'].includes(activeUser?.role || '');
  
  // Check if user is lab staff (technician, phlebotomist)
  const isLabStaff = ['lab_technician', 'phlebotomist'].includes(activeUser?.role || '');
  
  // Check if impersonation is active
  const isImpersonating = !!impersonatingUser;
  
  return {
    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    
    // User state
    userPermissions,
    userRole,
    isAuthenticated,
    isAdmin,
    isMedicalStaff,
    isLabStaff,
    isImpersonating,
    
    // User object
    user: activeUser,
  };
}

/**
 * Hook for checking a single permission
 * Returns boolean indicating if user has the permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

/**
 * Hook for checking multiple permissions (requires all)
 * Returns boolean indicating if user has all permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions);
}

/**
 * Hook for checking multiple permissions (requires any)
 * Returns boolean indicating if user has any of the permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
}

/**
 * Hook for checking resource access
 * Returns boolean indicating if user can access the resource
 */
export function useCanAccess(permission: Permission, resourceOwnerId?: string): boolean {
  const { canAccess } = usePermissions();
  return canAccess(permission, resourceOwnerId);
}

/**
 * Hook for getting user role
 * Returns the user's role or undefined if not authenticated
 */
export function useUserRole(): UserRole | undefined {
  const { userRole } = usePermissions();
  return userRole;
}

/**
 * Hook for checking if user is admin
 * Returns boolean indicating if user is admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = usePermissions();
  return isAdmin;
}