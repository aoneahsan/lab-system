import { create } from 'zustand';
import { inventoryService } from '@/services/inventory.service';
import { useTenantStore } from '@/stores/tenant.store';
import { auth } from '@/config/firebase.config';
import type { InventoryItem, StockTransaction, PurchaseOrder, Vendor, StockTransactionFormData, InventoryItemFormData } from '@/types/inventory.types';

interface InventoryStore {
  items: InventoryItem[];
  currentItem: InventoryItem | null;
  stockTransactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchInventoryItems: (filters?: any) => Promise<void>;
  fetchInventoryItem: (id: string) => Promise<void>;
  createInventoryItem: (data: InventoryItemFormData) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  recordStockTransaction: (data: StockTransactionFormData) => Promise<void>;
  fetchStockTransactions: (itemId?: string) => Promise<void>;
  
  fetchPurchaseOrders: (filters?: any) => Promise<void>;
  createPurchaseOrder: (data: Omit<PurchaseOrder, 'id' | 'tenantId' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => Promise<void>;
  
  fetchVendors: () => Promise<void>;
  createVendor: (data: Partial<Vendor>) => Promise<void>;
  updateVendor: (id: string, data: Partial<Vendor>) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  currentItem: null,
  stockTransactions: [],
  purchaseOrders: [],
  vendors: [],
  loading: false,
  error: null,

  fetchInventoryItems: async (filters) => {
    set({ loading: true, error: null });
    try {
      const result = await inventoryService.getInventoryItems(filters);
      set({ items: result.items, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchInventoryItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const item = await inventoryService.getInventoryItem(id);
      set({ currentItem: item || null, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  createInventoryItem: async (data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.createInventoryItem(data);
      await get().fetchInventoryItems();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updateInventoryItem: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.updateInventoryItem(id, data);
      await get().fetchInventoryItems();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  deleteInventoryItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.deleteInventoryItem(id);
      await get().fetchInventoryItems();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  recordStockTransaction: async (data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.recordStockMovement(data);
      await get().fetchInventoryItems();
      if (data.itemId) {
        await get().fetchStockTransactions(data.itemId);
      }
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchStockTransactions: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const transactions = await inventoryService.getStockMovements(itemId);
      set({ stockTransactions: transactions, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchPurchaseOrders: async (filters) => {
    set({ loading: true, error: null });
    try {
      const orders = await inventoryService.getPurchaseOrders();
      set({ purchaseOrders: orders, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  createPurchaseOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const tenantId = useTenantStore.getState().currentTenant?.id;
      const userId = auth.currentUser?.uid;
      if (!tenantId || !userId) throw new Error('No tenant or user');
      await inventoryService.createPurchaseOrder(tenantId, data as any, userId);
      await get().fetchPurchaseOrders();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updatePurchaseOrder: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.updatePurchaseOrder(id, data);
      await get().fetchPurchaseOrders();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchVendors: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement vendor service methods
      // const vendors = await inventoryService.getVendors();
      set({ vendors: [], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  createVendor: async (data) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement vendor service methods
      // await inventoryService.createVendor(data);
      // await get().fetchVendors();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updateVendor: async (id, data) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement vendor service methods
      // await inventoryService.updateVendor(id, data);
      // await get().fetchVendors();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));