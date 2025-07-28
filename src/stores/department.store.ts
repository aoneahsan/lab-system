import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from './auth.store';
import { useTenantStore } from './tenant.store';
import { PROJECT_PREFIX } from '@/constants/tenant.constants';

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  location?: string;
  phone?: string;
  email?: string;
  testTypes?: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  metadata?: {
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
  };
}

interface DepartmentStore {
  departments: Department[];
  loading: boolean;
  error: string | null;
  selectedDepartmentId: string | null;
  unsubscribe: Unsubscribe | null;
  
  // Actions
  fetchDepartments: () => Promise<void>;
  subscribeToDepartments: () => void;
  createDepartment: (data: Omit<Department, 'id' | 'tenantId' | 'metadata'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  setSelectedDepartment: (id: string | null) => void;
  getDepartmentById: (id: string) => Department | undefined;
  cleanup: () => void;
}

export const useDepartmentStore = create<DepartmentStore>()(
  devtools(
    persist(
      (set, get) => ({
        departments: [],
        loading: false,
        error: null,
        selectedDepartmentId: null,
        unsubscribe: null,

        fetchDepartments: async () => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) return;

          set({ loading: true, error: null });
          
          try {
            const projectPrefix = PROJECT_PREFIX;
            const q = query(
              collection(db, `${projectPrefix}departments`),
              where('tenantId', '==', currentTenant.id),
              where('isActive', '==', true),
              orderBy('name')
            );

            const snapshot = await getDocs(q);
            const departments = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Department));

            set({ departments, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch departments',
              loading: false 
            });
          }
        },

        subscribeToDepartments: () => {
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
            collection(db, `${projectPrefix}departments`),
            where('tenantId', '==', currentTenant.id),
            where('isActive', '==', true),
            orderBy('name')
          );

          const unsubscribe = onSnapshot(q, 
            (snapshot) => {
              const departments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as Department));
              set({ departments, loading: false, error: null });
            },
            (error) => {
              set({ 
                error: error.message,
                loading: false 
              });
            }
          );

          set({ unsubscribe });
        },

        createDepartment: async (data) => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) {
            throw new Error('User not authenticated');
          }

          set({ loading: true, error: null });

          try {
            const projectPrefix = PROJECT_PREFIX;
            const departmentData = {
              ...data,
              tenantId: currentTenant.id,
              metadata: {
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.id
              }
            };

            await addDoc(
              collection(db, `${projectPrefix}departments`),
              departmentData
            );

            // Refresh departments
            await get().fetchDepartments();
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create department',
              loading: false 
            });
            throw error;
          }
        },

        updateDepartment: async (id, data) => {
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
              'metadata.updatedBy': currentUser.uid
            };

            await updateDoc(
              doc(db, `${projectPrefix}departments`, id),
              updateData
            );

            // Update local state
            set(state => ({
              departments: state.departments.map(dept =>
                dept.id === id ? { ...dept, ...data } : dept
              ),
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update department',
              loading: false 
            });
            throw error;
          }
        },

        deleteDepartment: async (id) => {
          const { currentUser } = useAuthStore.getState();
          const { currentTenant } = useTenantStore.getState();
          if (!currentUser || !currentTenant) {
            throw new Error('User not authenticated');
          }

          set({ loading: true, error: null });

          try {
            const projectPrefix = PROJECT_PREFIX;
            
            // Soft delete by setting isActive to false
            await updateDoc(
              doc(db, `${projectPrefix}departments`, id),
              {
                isActive: false,
                'metadata.updatedAt': new Date().toISOString(),
                'metadata.updatedBy': currentUser.uid
              }
            );

            // Remove from local state
            set(state => ({
              departments: state.departments.filter(dept => dept.id !== id),
              loading: false,
              selectedDepartmentId: state.selectedDepartmentId === id ? null : state.selectedDepartmentId
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete department',
              loading: false 
            });
            throw error;
          }
        },

        setSelectedDepartment: (id) => {
          set({ selectedDepartmentId: id });
        },

        getDepartmentById: (id) => {
          return get().departments.find(dept => dept.id === id);
        },

        cleanup: () => {
          const { unsubscribe } = get();
          if (unsubscribe) {
            unsubscribe();
          }
          set({ 
            departments: [], 
            loading: false, 
            error: null, 
            selectedDepartmentId: null,
            unsubscribe: null 
          });
        }
      }),
      {
        name: 'department-store',
        partialize: (state) => ({ selectedDepartmentId: state.selectedDepartmentId })
      }
    )
  )
);