import { create } from 'zustand';
import { inventoryService } from '@/services/inventory.service';
import { useTenantStore } from '@/stores/tenant.store';
import { auth } from '@/config/firebase.config';
import type { InventoryItem, StockMovement, PurchaseOrder, Supplier } from '@/types/inventory';

interface InventoryStore {
  items: InventoryItem[];
  currentItem: InventoryItem | null;
  stockMovements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchInventoryItems: (filters?: any) => Promise<void>;
  fetchInventoryItem: (id: string) => Promise<void>;
  createInventoryItem: (data: Partial<InventoryItem>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  recordStockMovement: (data: Partial<StockMovement>) => Promise<void>;
  fetchStockMovements: (itemId?: string) => Promise<void>;
  
  fetchPurchaseOrders: (filters?: any) => Promise<void>;
  createPurchaseOrder: (data: Partial<PurchaseOrder>) => Promise<void>;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => Promise<void>;
  
  fetchSuppliers: () => Promise<void>;
  createSupplier: (data: Partial<Supplier>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  currentItem: null,
  stockMovements: [],
  purchaseOrders: [],
  suppliers: [],
  loading: false,
  error: null,

  fetchInventoryItems: async (filters) => {
    set({ loading: true, error: null });
    try {
      const items = await inventoryService.getInventoryItems(filters);
      set({ items, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchInventoryItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const item = await inventoryService.getInventoryItem(id);
      set({ currentItem: item, loading: false });
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

  recordStockMovement: async (data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.recordStockMovement(data);
      await get().fetchInventoryItems();
      if (data.itemId) {
        await get().fetchStockMovements(data.itemId);
      }
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchStockMovements: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const movements = await inventoryService.getStockMovements(itemId);
      set({ stockMovements: movements, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchPurchaseOrders: async (filters) => {
    set({ loading: true, error: null });
    try {
      const orders = await inventoryService.getPurchaseOrders(filters);
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
      await inventoryService.createPurchaseOrder(tenantId, data, userId);
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

  fetchSuppliers: async () => {
    set({ loading: true, error: null });
    try {
      const suppliers = await inventoryService.getSuppliers();
      set({ suppliers, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  createSupplier: async (data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.createSupplier(data);
      await get().fetchSuppliers();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updateSupplier: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.updateSupplier(id, data);
      await get().fetchSuppliers();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));