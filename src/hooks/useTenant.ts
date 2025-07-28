import { useEffect } from 'react';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';

export const useTenant = () => {
  const {
    currentTenant,
    isLoading,
    error,
    fetchTenant,
    refreshTenant,
    shouldRefetch,
    clearTenant,
  } = useTenantStore();

  const { currentUser } = useAuthStore();

  useEffect(() => {
    // Auto-fetch tenant when user logs in
    if (currentUser?.tenantId && (!currentTenant || currentTenant.id !== currentUser.tenantId)) {
      fetchTenant(currentUser.tenantId);
    }

    // Clear tenant when user logs out
    if (!currentUser && currentTenant) {
      clearTenant();
    }
  }, [currentUser, currentTenant, fetchTenant, clearTenant]);

  useEffect(() => {
    // Auto-refresh tenant data if cache is stale
    if (currentTenant && shouldRefetch()) {
      refreshTenant();
    }
  }, [currentTenant, shouldRefetch, refreshTenant]);

  return {
    tenant: currentTenant,
    isLoading,
    error,
    refreshTenant,
    isActive: currentTenant?.isActive ?? false,
    subscription: currentTenant?.subscription,
    settings: currentTenant?.settings,
    features: currentTenant?.settings?.features,
  };
};
