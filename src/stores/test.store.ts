import { create } from 'zustand';
import { collection, query, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TestDefinition } from '@/types/test.types';
import { toast } from 'sonner';

interface TestStore {
  tests: TestDefinition[];
  isLoading: boolean;
  error: string | null;
  
  fetchTests: (tenantId: string) => Promise<void>;
  createTest: (tenantId: string, test: Partial<TestDefinition>) => Promise<void>;
  updateTest: (tenantId: string, testId: string, updates: Partial<TestDefinition>) => Promise<void>;
  deleteTest: (tenantId: string, testId: string) => Promise<void>;
}

export const useTestStore = create<TestStore>((set) => ({
  tests: [],
  isLoading: false,
  error: null,

  fetchTests: async (tenantId) => {
    set({ isLoading: true, error: null });
    try {
      const testsRef = collection(db, `tenants/${tenantId}/tests`);
      const q = query(testsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const tests: TestDefinition[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as TestDefinition));
      
      set({ tests, isLoading: false });
    } catch (error) {
      console.error('Error fetching tests:', error);
      set({ error: 'Failed to fetch tests', isLoading: false });
      toast.error('Failed to fetch tests');
    }
  },

  createTest: async (tenantId, test) => {
    try {
      const testsRef = collection(db, `tenants/${tenantId}/tests`);
      const docRef = await addDoc(testsRef, {
        ...test,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const newTest = { ...test, id: docRef.id } as TestDefinition;
      set(state => ({ tests: [...state.tests, newTest] }));
      
      toast.success('Test created successfully');
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
      throw error;
    }
  },

  updateTest: async (tenantId, testId, updates) => {
    try {
      const testRef = doc(db, `tenants/${tenantId}/tests`, testId);
      await updateDoc(testRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      set(state => ({
        tests: state.tests.map(test =>
          test.id === testId ? { ...test, ...updates } : test
        ),
      }));
      
      toast.success('Test updated successfully');
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error('Failed to update test');
      throw error;
    }
  },

  deleteTest: async (tenantId, testId) => {
    try {
      const testRef = doc(db, `tenants/${tenantId}/tests`, testId);
      await deleteDoc(testRef);
      
      set(state => ({
        tests: state.tests.filter(test => test.id !== testId),
      }));
      
      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
      throw error;
    }
  },
}));