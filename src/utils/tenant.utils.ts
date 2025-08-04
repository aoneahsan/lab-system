import { getCollectionName, getStoragePath, getTenantPrefix } from '@/constants/tenant.constants';

/**
 * Get tenant-specific collection name
 * @param tenantId - The tenant identifier
 * @param collectionName - The base collection name
 * @returns The tenant-specific collection name
 */
export const getTenantSpecificCollectionName = (tenantId: string, collectionName: string): string => {
  return getCollectionName(tenantId, collectionName);
};

/**
 * Get tenant-specific storage path
 * @param tenantId - The tenant identifier
 * @param path - The base storage path
 * @returns The tenant-specific storage path
 */
export const getTenantSpecificStoragePath = (tenantId: string, path: string): string => {
  return getStoragePath(tenantId, path);
};

/**
 * Get tenant prefix
 * @param tenantId - The tenant identifier
 * @returns The tenant prefix
 */
export const getTenantPrefixForId = (tenantId: string): string => {
  return getTenantPrefix(tenantId);
};

/**
 * Parse tenant ID from a collection name
 * @param collectionName - The full collection name
 * @returns The tenant ID or null if not found
 */
export const parseTenantIdFromCollectionName = (collectionName: string): string | null => {
  const match = collectionName.match(/^labflow_([^_]+)_/);
  return match ? match[1] : null;
};

/**
 * Check if a collection name belongs to a specific tenant
 * @param collectionName - The collection name to check
 * @param tenantId - The tenant ID to check against
 * @returns True if the collection belongs to the tenant
 */
export const isCollectionForTenant = (collectionName: string, tenantId: string): boolean => {
  const prefix = getTenantPrefix(tenantId);
  return collectionName.startsWith(prefix);
};