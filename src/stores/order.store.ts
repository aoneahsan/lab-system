import { create } from 'zustand';
import { orderService } from '@/services/order.service';
import type { TestOrder, Specimen } from '@/types/order';

interface OrderStore {
  orders: TestOrder[];
  currentOrder: TestOrder | null;
  specimens: Specimen[];
  pendingCollections: TestOrder[];
  todayOrders: TestOrder[];
  loading: boolean;
  error: string | null;

  // Actions
  createTestOrder: (data: Partial<TestOrder>) => Promise<string>;
  fetchTestOrders: (filters?: any) => Promise<void>;
  fetchTestOrder: (id: string) => Promise<void>;
  updateTestOrder: (id: string, data: Partial<TestOrder>) => Promise<void>;
  updateTestStatus: (orderId: string, testId: string, status: string) => Promise<void>;
  
  createSpecimen: (data: Partial<Specimen>) => Promise<string>;
  fetchSpecimens: (orderId?: string) => Promise<void>;
  updateSpecimen: (id: string, data: Partial<Specimen>) => Promise<void>;
  receiveSpecimen: (id: string, receivedBy: string) => Promise<void>;
  
  searchOrders: (query: string) => Promise<void>;
  fetchPendingCollections: () => Promise<void>;
  fetchTodayOrders: () => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  specimens: [],
  pendingCollections: [],
  todayOrders: [],
  loading: false,
  error: null,

  createTestOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const orderId = await orderService.createTestOrder(data);
      await get().fetchTestOrders();
      return orderId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
      throw error;
    }
  },

  fetchTestOrders: async (filters) => {
    set({ loading: true, error: null });
    try {
      const orders = await orderService.getTestOrders(filters);
      set({ orders, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchTestOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const order = await orderService.getTestOrder(id);
      set({ currentOrder: order, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updateTestOrder: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await orderService.updateTestOrder(id, data);
      await get().fetchTestOrders();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updateTestStatus: async (orderId, testId, status) => {
    set({ loading: true, error: null });
    try {
      await orderService.updateTestStatus(orderId, testId, status as any);
      await get().fetchTestOrder(orderId);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  createSpecimen: async (data) => {
    set({ loading: true, error: null });
    try {
      const specimenId = await orderService.createSpecimen(data);
      if (data.orderId) {
        await get().fetchSpecimens(data.orderId);
      }
      return specimenId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
      throw error;
    }
  },

  fetchSpecimens: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const specimens = await orderService.getSpecimens(orderId);
      set({ specimens, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  updateSpecimen: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await orderService.updateSpecimen(id, data);
      await get().fetchSpecimens();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  receiveSpecimen: async (id, receivedBy) => {
    set({ loading: true, error: null });
    try {
      await orderService.receiveSpecimen(id, receivedBy);
      await get().fetchSpecimens();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  searchOrders: async (query) => {
    set({ loading: true, error: null });
    try {
      const orders = await orderService.searchOrders(query);
      set({ orders, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchPendingCollections: async () => {
    set({ loading: true, error: null });
    try {
      const collections = await orderService.getPendingCollections();
      set({ pendingCollections: collections, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchTodayOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await orderService.getTodayOrders();
      set({ todayOrders: orders, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));