import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useAuthStore } from './auth.store';
import { useTenantStore } from './tenant.store';
import { PROJECT_PREFIX } from '@/constants/tenant.constants';

export interface Analyzer {
  id: string;
  tenantId: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  departmentId?: string;
  type: 'chemistry' | 'hematology' | 'immunology' | 'microbiology' | 'molecular' | 'other';
  capabilities: string[];
  interfaceType?: 'HL7' | 'ASTM' | 'Serial' | 'TCP/IP' | 'API';
  connectionSettings?: {
    host?: string;
    port?: number;
    baudRate?: number;
    dataBits?: number;
    stopBits?: number;
    parity?: string;
  };
  maintenanceSchedule?: {
    lastMaintenance?: string;
    nextMaintenance?: string;
    maintenanceInterval?: number; // days
  };
  calibration?: {
    lastCalibration?: string;
    nextCalibration?: string;
    calibrationInterval?: number; // days
  };
  metadata?: {
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
  };
}

export interface AnalyzerTest {
  id: string;
  analyzerId: string;
  testCode: string;
  testName: string;
  turnaroundTime?: number; // minutes
  sampleVolume?: number; // ml
  units?: string;
  referenceRange?: {
    min?: number;
    max?: number;
    normal?: string;
  };
}

interface AnalyzerStore {
  analyzers: Analyzer[];
  analyzerTests: Map<string, AnalyzerTest[]>;
  loading: boolean;
  error: string | null;
  selectedAnalyzerId: string | null;
  unsubscribe: Unsubscribe | null;

  // Actions
  fetchAnalyzers: () => Promise<void>;
  subscribeToAnalyzers: () => void;
  createAnalyzer: (data: Omit<Analyzer, 'id' | 'tenantId' | 'metadata'>) => Promise<void>;
  updateAnalyzer: (id: string, data: Partial<Analyzer>) => Promise<void>;
  deleteAnalyzer: (id: string) => Promise<void>;
  setAnalyzerStatus: (id: string, status: Analyzer['status']) => Promise<void>;
  setSelectedAnalyzer: (id: string | null) => void;
  getAnalyzerById: (id: string) => Analyzer | undefined;
  getAnalyzersByDepartment: (departmentId: string) => Analyzer[];
  getActiveAnalyzers: () => Analyzer[];
  addAnalyzerTest: (
    analyzerId: string,
    test: Omit<AnalyzerTest, 'id' | 'analyzerId'>
  ) => Promise<void>;
  removeAnalyzerTest: (analyzerId: string, testId: string) => Promise<void>;
  cleanup: () => void;
}

export const useAnalyzerStore = create<AnalyzerStore>()(
  devtools(
    persist(
      (set, get) => ({
        analyzers: [],
        analyzerTests: new Map(),
        loading: false,
        error: null,
        selectedAnalyzerId: null,
        unsubscribe: null,

        fetchAnalyzers: async () => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) return;

          set({ loading: true, error: null });

          try {
            const projectPrefix = PROJECT_PREFIX;
            const q = query(
              collection(db, `${projectPrefix}analyzers`),
              where('tenantId', '==', currentTenant.id),
              orderBy('name')
            );

            const snapshot = await getDocs(q);
            const analyzers = snapshot.docs.map(
              (doc) =>
                ({
                  id: doc.id,
                  ...doc.data(),
                }) as Analyzer
            );

            set({ analyzers, loading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch analyzers',
              loading: false,
            });
          }
        },

        subscribeToAnalyzers: () => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) return;

          // Cleanup existing subscription
          const { unsubscribe: existingUnsubscribe } = get();
          if (existingUnsubscribe) {
            existingUnsubscribe();
          }

          const projectPrefix = PROJECT_PREFIX;
          const q = query(
            collection(db, `${projectPrefix}analyzers`),
            where('tenantId', '==', currentTenant.id),
            orderBy('name')
          );

          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const analyzers = snapshot.docs.map(
                (doc) =>
                  ({
                    id: doc.id,
                    ...doc.data(),
                  }) as Analyzer
              );
              set({ analyzers, loading: false, error: null });
            },
            (error) => {
              set({
                error: error.message,
                loading: false,
              });
            }
          );

          set({ unsubscribe });
        },

        createAnalyzer: async (data) => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) {
            throw new Error('User not authenticated');
          }

          set({ loading: true, error: null });

          try {
            const projectPrefix = PROJECT_PREFIX;
            const analyzerData = {
              ...data,
              tenantId: currentTenant.id,
              metadata: {
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.id,
              },
            };

            await addDoc(collection(db, `${projectPrefix}analyzers`), analyzerData);

            // Refresh analyzers
            await get().fetchAnalyzers();
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create analyzer',
              loading: false,
            });
            throw error;
          }
        },

        updateAnalyzer: async (id, data) => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) {
            throw new Error('User not authenticated');
          }

          set({ loading: true, error: null });

          try {
            const projectPrefix = PROJECT_PREFIX;
            const updateData = {
              ...data,
              'metadata.updatedAt': new Date().toISOString(),
              'metadata.updatedBy': currentUser.uid,
            };

            await updateDoc(doc(db, `${projectPrefix}analyzers`, id), updateData);

            // Update local state
            set((state) => ({
              analyzers: state.analyzers.map((analyzer) =>
                analyzer.id === id ? { ...analyzer, ...data } : analyzer
              ),
              loading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update analyzer',
              loading: false,
            });
            throw error;
          }
        },

        deleteAnalyzer: async (id) => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) {
            throw new Error('User not authenticated');
          }

          set({ loading: true, error: null });

          try {
            const projectPrefix = PROJECT_PREFIX;

            await deleteDoc(doc(db, `${projectPrefix}analyzers`, id));

            // Remove from local state
            set((state) => ({
              analyzers: state.analyzers.filter((analyzer) => analyzer.id !== id),
              loading: false,
              selectedAnalyzerId: state.selectedAnalyzerId === id ? null : state.selectedAnalyzerId,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to delete analyzer',
              loading: false,
            });
            throw error;
          }
        },

        setAnalyzerStatus: async (id, status) => {
          await get().updateAnalyzer(id, { status });
        },

        setSelectedAnalyzer: (id) => {
          set({ selectedAnalyzerId: id });
        },

        getAnalyzerById: (id) => {
          return get().analyzers.find((analyzer) => analyzer.id === id);
        },

        getAnalyzersByDepartment: (departmentId) => {
          return get().analyzers.filter((analyzer) => analyzer.departmentId === departmentId);
        },

        getActiveAnalyzers: () => {
          return get().analyzers.filter((analyzer) => analyzer.status === 'active');
        },

        addAnalyzerTest: async (analyzerId, test) => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) {
            throw new Error('User not authenticated');
          }

          const projectPrefix = PROJECT_PREFIX;
          const testData = {
            ...test,
            analyzerId,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
          };

          const docRef = await addDoc(collection(db, `${projectPrefix}analyzer_tests`), testData);

          // Update local state
          set((state) => {
            const tests = state.analyzerTests.get(analyzerId) || [];
            const newTests = new Map(state.analyzerTests);
            newTests.set(analyzerId, [...tests, { ...testData, id: docRef.id } as AnalyzerTest]);
            return { analyzerTests: newTests };
          });
        },

        removeAnalyzerTest: async (analyzerId, testId) => {
          const { currentTenant } = useTenantStore.getState();
          if (!currentTenant) {
            throw new Error('Tenant not found');
          }

          const projectPrefix = PROJECT_PREFIX;
          await deleteDoc(doc(db, `${projectPrefix}analyzer_tests`, testId));

          // Update local state
          set((state) => {
            const tests = state.analyzerTests.get(analyzerId) || [];
            const newTests = new Map(state.analyzerTests);
            newTests.set(
              analyzerId,
              tests.filter((t) => t.id !== testId)
            );
            return { analyzerTests: newTests };
          });
        },

        cleanup: () => {
          const { unsubscribe } = get();
          if (unsubscribe) {
            unsubscribe();
          }
          set({
            analyzers: [],
            analyzerTests: new Map(),
            loading: false,
            error: null,
            selectedAnalyzerId: null,
            unsubscribe: null,
          });
        },
      }),
      {
        name: 'analyzer-store',
        partialize: (state) => ({ selectedAnalyzerId: state.selectedAnalyzerId }),
      }
    )
  )
);
