import { create } from 'zustand';
import { sampleService } from '@/services/sample.service';
import { Sample, SampleCollection } from '@/types/sample.types';

interface SampleStore {
  samples: Sample[];
  currentSample: Sample | null;
  sampleCollections: SampleCollection[];
  statistics: any;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSamples: (tenantId: string, filters?: any) => Promise<void>;
  fetchSample: (tenantId: string, id: string) => Promise<void>;
  createSample: (tenantId: string, userId: string, data: any) => Promise<string>;
  updateSample: (tenantId: string, userId: string, id: string, data: any) => Promise<void>;
  updateSampleStatus: (tenantId: string, userId: string, id: string, status: string, notes?: string, location?: string) => Promise<void>;
  deleteSample: (tenantId: string, id: string) => Promise<void>;
  
  fetchSampleCollections: (tenantId: string, filters?: any) => Promise<void>;
  createSampleCollection: (tenantId: string, userId: string, data: any) => Promise<string>;
  completeSampleCollection: (tenantId: string, userId: string, collectionId: string, collectedSamples: any[]) => Promise<void>;
  
  fetchSampleStatistics: (tenantId: string) => Promise<void>;
  batchUpdateSamples: (tenantId: string, userId: string, sampleIds: string[], updates: any) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSampleStore = create<SampleStore>((set, get) => ({
  samples: [],
  currentSample: null,
  sampleCollections: [],
  statistics: null,
  loading: false,
  error: null,

  fetchSamples: async (tenantId, filters) => {
    set({ loading: true, error: null });
    try {
      const samples = await sampleService.getSamples(tenantId, filters);
      set({ samples, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSample: async (tenantId, id) => {
    set({ loading: true, error: null });
    try {
      const sample = await sampleService.getSample(tenantId, id);
      set({ currentSample: sample, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createSample: async (tenantId, userId, data) => {
    set({ loading: true, error: null });
    try {
      const sample = await sampleService.createSample(tenantId, userId, data);
      await get().fetchSamples(tenantId);
      set({ loading: false });
      return sample.id;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSample: async (tenantId, userId, id, data) => {
    set({ loading: true, error: null });
    try {
      await sampleService.updateSample(tenantId, userId, id, data);
      await get().fetchSamples(tenantId);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateSampleStatus: async (tenantId, userId, id, status, notes, location) => {
    set({ loading: true, error: null });
    try {
      await sampleService.updateSampleStatus(tenantId, userId, id, status as any, notes, location);
      await get().fetchSamples(tenantId);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  deleteSample: async (tenantId, id) => {
    set({ loading: true, error: null });
    try {
      await sampleService.deleteSample(tenantId, id);
      await get().fetchSamples(tenantId);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSampleCollections: async (tenantId, filters) => {
    set({ loading: true, error: null });
    try {
      const collections = await sampleService.getSampleCollections(tenantId, filters);
      set({ sampleCollections: collections, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createSampleCollection: async (tenantId, userId, data) => {
    set({ loading: true, error: null });
    try {
      const collection = await sampleService.createSampleCollection(tenantId, userId, data);
      await get().fetchSampleCollections(tenantId);
      set({ loading: false });
      return collection.id;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeSampleCollection: async (tenantId, userId, collectionId, collectedSamples) => {
    set({ loading: true, error: null });
    try {
      await sampleService.completeSampleCollection(tenantId, userId, collectionId, collectedSamples);
      await get().fetchSampleCollections(tenantId);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSampleStatistics: async (tenantId) => {
    set({ loading: true, error: null });
    try {
      const statistics = await sampleService.getSampleStatistics(tenantId);
      set({ statistics, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  batchUpdateSamples: async (tenantId, userId, sampleIds, updates) => {
    set({ loading: true, error: null });
    try {
      await sampleService.batchUpdateSamples(tenantId, userId, sampleIds, updates);
      await get().fetchSamples(tenantId);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));