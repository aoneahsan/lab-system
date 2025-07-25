import { create } from 'zustand';
import { qualityControlService } from '@/services/quality-control.service';
import { QCTest, QCResult, QCStatistics } from '@/types/quality-control';

interface QualityControlStore {
  qcTests: QCTest[];
  currentTest: QCTest | null;
  qcResults: QCResult[];
  statistics: QCStatistics | null;
  leveyJenningsData: any[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchQCTests: (filters?: any) => Promise<void>;
  createQCTest: (data: Partial<QCTest>) => Promise<void>;
  recordQCResult: (data: Partial<QCResult>) => Promise<{ violations: string[] }>;
  fetchQCResults: (qcTestId: string, levelId?: string, days?: number) => Promise<void>;
  calculateStatistics: (qcTestId: string, levelId: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly') => Promise<void>;
  fetchLeveyJenningsData: (qcTestId: string, levelId: string, days?: number) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useQualityControlStore = create<QualityControlStore>((set, get) => ({
  qcTests: [],
  currentTest: null,
  qcResults: [],
  statistics: null,
  leveyJenningsData: [],
  loading: false,
  error: null,

  fetchQCTests: async (filters) => {
    set({ loading: true, error: null });
    try {
      const tests = await qualityControlService.getQCTests(filters);
      set({ qcTests: tests, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createQCTest: async (data) => {
    set({ loading: true, error: null });
    try {
      await qualityControlService.createQCTest(data);
      await get().fetchQCTests();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  recordQCResult: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await qualityControlService.recordQCResult(data);
      await get().fetchQCResults(data.qcTestId!, data.levelId);
      set({ loading: false });
      return result;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchQCResults: async (qcTestId, levelId, days = 30) => {
    set({ loading: true, error: null });
    try {
      const results = await qualityControlService.getQCResults(qcTestId, levelId, days);
      set({ qcResults: results, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  calculateStatistics: async (qcTestId, levelId, period) => {
    set({ loading: true, error: null });
    try {
      const stats = await qualityControlService.calculateStatistics(qcTestId, levelId, period);
      set({ statistics: stats, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLeveyJenningsData: async (qcTestId, levelId, days = 30) => {
    set({ loading: true, error: null });
    try {
      const data = await qualityControlService.getLeveyJenningsData(qcTestId, levelId, days);
      set({ leveyJenningsData: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));