import { create } from 'zustand';
import { resultService } from '@/services/result.service';
import type { TestResult, ResultEntry } from '@/types/result.types';
import type { Timestamp } from 'firebase/firestore';

interface ResultStore {
  results: TestResult[];
  currentResult: TestResult | null;
  loading: boolean;
  error: string | null;
  validationWarnings: string[];
  validationErrors: string[];

  // Actions
  fetchResultsByOrder: (tenantId: string, orderId: string) => Promise<void>;
  fetchResultsByPatient: (tenantId: string, patientId: string) => Promise<void>;
  enterResults: (tenantId: string, userId: string, entry: ResultEntry) => Promise<void>;
  updateResult: (tenantId: string, userId: string, resultId: string, data: Partial<TestResult>) => Promise<void>;
  verifyResult: (tenantId: string, userId: string, resultId: string) => Promise<void>;
  validateResult: (tenantId: string, testId: string, value: number) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useResultStore = create<ResultStore>((set, get) => ({
  results: [],
  currentResult: null,
  loading: false,
  error: null,
  validationWarnings: [],
  validationErrors: [],

  fetchResultsByOrder: async (tenantId, orderId) => {
    set({ loading: true, error: null });
    try {
      const results = await resultService.getResultsByOrder(tenantId, orderId);
      set({ results, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  fetchResultsByPatient: async (tenantId, patientId) => {
    set({ loading: true, error: null });
    try {
      const results = await resultService.getResultsByPatient(tenantId, patientId);
      set({ results, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  enterResults: async (tenantId, userId, entry) => {
    set({ loading: true, error: null });
    try {
      for (const test of entry.tests) {
        await resultService.createResult(tenantId, userId, {
          orderId: entry.orderId,
          sampleId: entry.sampleId,
          patientId: '', // This should be passed from the order
          testId: test.testId,
          testName: test.testName,
          category: '', // This should be from test definition
          value: test.value,
          unit: test.unit,
          flag: test.flag,
          comments: test.comments,
          status: 'entered',
          enteredBy: userId,
          enteredAt: new Date() as unknown as Timestamp,
        });
      }
      await get().fetchResultsByOrder(tenantId, entry.orderId);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
      throw error;
    }
  },

  updateResult: async (tenantId, userId, resultId, data) => {
    set({ loading: true, error: null });
    try {
      await resultService.updateResult(tenantId, userId, resultId, data);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  verifyResult: async (tenantId, userId, resultId) => {
    set({ loading: true, error: null });
    try {
      await resultService.verifyResult(tenantId, userId, resultId);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred', loading: false });
    }
  },

  validateResult: async (tenantId, testId, value) => {
    try {
      const validation = await resultService.validateResult(tenantId, testId, value);
      set({ 
        validationWarnings: validation.warnings,
        validationErrors: validation.errors
      });
    } catch (error) {
      console.error('Validation error:', error);
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));