import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { SHARED_COLLECTIONS } from '@/config/firebase-collections-helper';
import type {
  TestDefinition,
  TestDefinitionFormData,
  TestPanel,
  TestOrder,
  TestOrderFormData,
  TestFilter,
  TestOrderFilter,
  OrderedTest,
} from '@/types/test.types';

// These are shared collections across all tenants
const TESTS_COLLECTION = SHARED_COLLECTIONS.LABFLOW_TESTS;
const TEST_PANELS_COLLECTION = SHARED_COLLECTIONS.LABFLOW_TEST_PANELS;
const TEST_ORDERS_COLLECTION = SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS;

export const testService = {
  // Test Definition CRUD
  async getTests(tenantId: string, filter?: TestFilter): Promise<TestDefinition[]> {
    const constraints: QueryConstraint[] = [where('tenantId', '==', tenantId)];

    if (filter?.category) {
      constraints.push(where('category', '==', filter.category));
    }

    if (filter?.department) {
      constraints.push(where('department', '==', filter.department));
    }

    if (filter?.isActive !== undefined) {
      constraints.push(where('isActive', '==', filter.isActive));
    }

    if (filter?.specimenType) {
      constraints.push(where('specimen.type', '==', filter.specimenType));
    }

    constraints.push(orderBy('name'));

    const q = query(collection(db, TESTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TestDefinition[];
  },

  async getTestById(testId: string): Promise<TestDefinition | null> {
    const docRef = doc(db, TESTS_COLLECTION, testId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TestDefinition;
  },

  async getTestByCode(tenantId: string, code: string): Promise<TestDefinition | null> {
    const q = query(
      collection(db, TESTS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('code', '==', code),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as TestDefinition;
  },

  async createTest(
    tenantId: string,
    userId: string,
    data: TestDefinitionFormData
  ): Promise<TestDefinition> {
    const testData = {
      ...data,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
      referenceRanges: [], // Initialize with empty array
    };

    const docRef = await addDoc(collection(db, TESTS_COLLECTION), testData);
    const newDoc = await getDoc(docRef);

    return {
      id: docRef.id,
      ...newDoc.data(),
    } as TestDefinition;
  },

  async updateTest(
    testId: string,
    userId: string,
    data: Partial<TestDefinitionFormData>
  ): Promise<void> {
    const docRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async deleteTest(testId: string): Promise<void> {
    const docRef = doc(db, TESTS_COLLECTION, testId);
    await deleteDoc(docRef);
  },

  // Test Panel CRUD
  async getTestPanels(tenantId: string): Promise<TestPanel[]> {
    const q = query(
      collection(db, TEST_PANELS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('isActive', '==', true),
      orderBy('name')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TestPanel[];
  },

  async getTestPanelById(panelId: string): Promise<TestPanel | null> {
    const docRef = doc(db, TEST_PANELS_COLLECTION, panelId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TestPanel;
  },

  async createTestPanel(
    tenantId: string,
    userId: string,
    data: Omit<TestPanel, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ): Promise<TestPanel> {
    const panelData = {
      ...data,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, TEST_PANELS_COLLECTION), panelData);
    const newDoc = await getDoc(docRef);

    return {
      id: docRef.id,
      ...newDoc.data(),
    } as TestPanel;
  },

  async updateTestPanel(
    panelId: string,
    userId: string,
    data: Partial<TestPanel>
  ): Promise<void> {
    const docRef = doc(db, TEST_PANELS_COLLECTION, panelId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async deleteTestPanel(panelId: string): Promise<void> {
    const docRef = doc(db, TEST_PANELS_COLLECTION, panelId);
    await deleteDoc(docRef);
  },

  // Test Order Management
  async createTestOrder(
    tenantId: string,
    userId: string,
    providerId: string,
    providerName: string,
    data: TestOrderFormData
  ): Promise<TestOrder> {
    // Generate order number (format: ORD-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ORD-${dateStr}-${randomNum}`;

    // Get test details for ordered tests
    const tests = await Promise.all(
      data.tests.map(async (testId) => {
        const test = await this.getTestById(testId);
        if (!test) throw new Error(`Test ${testId} not found`);
        return test;
      })
    );

    const testDetails = tests.map(test => ({
      testId: test.id,
      testName: test.name,
      testCode: test.code,
      status: 'pending' as const,
    }));

    // Check if any test requires approval
    const requiresApproval = tests.some(test => test.requiresApproval);
    
    const orderData = {
      tenantId,
      patientId: data.patientId,
      orderNumber,
      tests: testDetails,
      orderingProviderId: providerId,
      orderingProviderName: providerName,
      orderDate: serverTimestamp(),
      priority: data.priority,
      clinicalHistory: data.clinicalHistory,
      diagnosis: data.diagnosis,
      icdCodes: data.icdCodes || [],
      fasting: data.fasting || false,
      status: requiresApproval ? 'awaiting_approval' as const : 'pending' as const,
      requiresApproval,
      notes: data.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, TEST_ORDERS_COLLECTION), orderData);
    const newDoc = await getDoc(docRef);

    return {
      id: docRef.id,
      ...newDoc.data(),
    } as TestOrder;
  },

  async getTestOrders(
    tenantId: string,
    filter?: TestOrderFilter
  ): Promise<TestOrder[]> {
    const constraints: QueryConstraint[] = [where('tenantId', '==', tenantId)];

    if (filter?.status) {
      constraints.push(where('status', '==', filter.status));
    }

    if (filter?.priority) {
      constraints.push(where('priority', '==', filter.priority));
    }

    if (filter?.patientId) {
      constraints.push(where('patientId', '==', filter.patientId));
    }

    if (filter?.providerId) {
      constraints.push(where('orderingProviderId', '==', filter.providerId));
    }

    constraints.push(orderBy('orderDate', 'desc'));

    const q = query(collection(db, TEST_ORDERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TestOrder[];
  },

  async getTestOrderById(orderId: string): Promise<TestOrder | null> {
    const docRef = doc(db, TEST_ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TestOrder;
  },

  async updateTestOrder(
    orderId: string,
    userId: string,
    data: Partial<TestOrder>
  ): Promise<void> {
    const docRef = doc(db, TEST_ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async approveTestOrder(
    orderId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const docRef = doc(db, TEST_ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      status: 'approved',
      approvedBy: userId,
      approvedAt: serverTimestamp(),
      notes,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async rejectTestOrder(
    orderId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    const docRef = doc(db, TEST_ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      status: 'rejected',
      rejectedBy: userId,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async updateTestOrderStatus(
    orderId: string,
    userId: string,
    status: TestOrder['status'],
    cancelReason?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (status === 'cancelled' && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    const docRef = doc(db, TEST_ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, updateData as any);
  },

  async updateOrderedTestStatus(
    orderId: string,
    testId: string,
    userId: string,
    status: OrderedTest['status']
  ): Promise<void> {
    const order = await this.getTestOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const updatedTests = order.tests.map((test) =>
      test.testId === testId ? { ...test, status } : test
    );

    await this.updateTestOrder(orderId, userId, { tests: updatedTests });
  },

  // Bulk operations
  async createBulkTests(
    tenantId: string,
    userId: string,
    tests: TestDefinitionFormData[]
  ): Promise<void> {
    const batch = writeBatch(db);

    tests.forEach((test) => {
      const docRef = doc(collection(db, TESTS_COLLECTION));
      batch.set(docRef, {
        ...test,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
        referenceRanges: [],
      });
    });

    await batch.commit();
  },

  // Search functions
  async searchTestsByName(
    tenantId: string,
    searchTerm: string,
    maxResults = 10
  ): Promise<TestDefinition[]> {
    // Note: This is a simple prefix search. For more advanced search,
    // consider using a dedicated search service like Algolia
    const q = query(
      collection(db, TESTS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('isActive', '==', true),
      orderBy('name'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const allTests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TestDefinition[];

    // Client-side filtering for partial matches
    const searchLower = searchTerm.toLowerCase();
    return allTests.filter(
      (test) =>
        test.name.toLowerCase().includes(searchLower) ||
        test.code.toLowerCase().includes(searchLower) ||
        test.loincCode?.code?.toLowerCase().includes(searchLower)
    );
  },

  // Statistics
  async getTestStatistics(tenantId: string): Promise<{
    totalTests: number;
    activeTests: number;
    testsByCategory: Record<string, number>;
    testsBySpecimenType: Record<string, number>;
  }> {
    const tests = await this.getTests(tenantId);

    const stats = {
      totalTests: tests.length,
      activeTests: tests.filter((t) => t.isActive).length,
      testsByCategory: {} as Record<string, number>,
      testsBySpecimenType: {} as Record<string, number>,
    };

    tests.forEach((test) => {
      // Count by category
      stats.testsByCategory[test.category] = (stats.testsByCategory[test.category] || 0) + 1;

      // Count by specimen type
      stats.testsBySpecimenType[test.specimen.type] =
        (stats.testsBySpecimenType[test.specimen.type] || 0) + 1;
    });

    return stats;
  },
};