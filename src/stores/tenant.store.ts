import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@config/firebase.config';
import { TENANT_COLLECTION } from '@constants/tenant.constants';
import type { Tenant } from '@types/tenant.types';

interface TenantStore {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  lastFetch: number | null;
  
  setCurrentTenant: (tenant: Tenant | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  clearTenant: () => void;
  
  fetchTenant: (tenantId: string) => Promise<Tenant | null>;
  refreshTenant: () => Promise<void>;
  shouldRefetch: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useTenantStore = create<TenantStore>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      isLoading: false,
      error: null,
      lastFetch: null,
      
      setCurrentTenant: (tenant) => set({ currentTenant: tenant, lastFetch: Date.now() }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearTenant: () => set({ currentTenant: null, error: null, lastFetch: null }),
      
      fetchTenant: async (tenantId) => {
        const { setLoading, setError, setCurrentTenant } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const tenantDoc = await getDoc(doc(firestore, TENANT_COLLECTION, tenantId));
          
          if (!tenantDoc.exists()) {
            throw new Error('Tenant not found');
          }
          
          const tenantData = {
            id: tenantDoc.id,
            ...tenantDoc.data(),
            createdAt: tenantDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: tenantDoc.data().updatedAt?.toDate() || new Date(),
            subscription: {
              ...tenantDoc.data().subscription,
              startDate: tenantDoc.data().subscription?.startDate?.toDate() || new Date(),
              endDate: tenantDoc.data().subscription?.endDate?.toDate(),
            },
          } as Tenant;
          
          setCurrentTenant(tenantData);
          return tenantData;
        } catch (error) {
          setError(error as Error);
          return null;
        } finally {
          setLoading(false);
        }
      },
      
      refreshTenant: async () => {
        const { currentTenant, fetchTenant } = get();
        if (currentTenant) {
          await fetchTenant(currentTenant.id);
        }
      },
      
      shouldRefetch: () => {
        const { lastFetch } = get();
        if (!lastFetch) return true;
        return Date.now() - lastFetch > CACHE_DURATION;
      },
    }),
    {
      name: 'tenant-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        lastFetch: state.lastFetch,
      }),
    }
  )
);