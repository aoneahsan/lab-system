import { db } from '@/config/firebase';
import { SHARED_COLLECTIONS } from '@/config/firebase-collections-helper';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';
import { TestOrder, OrderedTest, Specimen } from '@/types/order';
import { getCurrentUser } from './auth.service';
import { generateId } from '@/utils/helpers';

// Order service uses shared collections

export const orderService = {
  // Test Orders
  async createTestOrder(data: Partial<TestOrder>): Promise<string> {
    const user = await getCurrentUser();
    const orderNumber = `ORD-${Date.now()}`;
    const barcode = this.generateBarcode();
    
    const docRef = await addDoc(collection(db, SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS), {
      ...data,
      id: generateId(),
      orderNumber,
      barcode,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: user?.uid
    });
    
    return docRef.id;
  },

  async getTestOrders(filters?: any): Promise<TestOrder[]> {
    const constraints = [];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.patientId) {
      constraints.push(where('patientId', '==', filters.patientId));
    }
    if (filters?.dateFrom) {
      constraints.push(where('orderDate', '>=', Timestamp.fromDate(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      constraints.push(where('orderDate', '<=', Timestamp.fromDate(filters.dateTo)));
    }
    
    constraints.push(orderBy('orderDate', 'desc'));
    
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const q = query(
      collection(db, SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS),
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TestOrder));
  },

  async getTestOrder(id: string): Promise<TestOrder | null> {
    const docRef = doc(db, SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as TestOrder;
  },

  async updateTestOrder(id: string, data: Partial<TestOrder>): Promise<void> {
    const docRef = doc(db, SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  async updateTestStatus(orderId: string, testId: string, status: OrderedTest['status']): Promise<void> {
    const order = await this.getTestOrder(orderId);
    if (!order) throw new Error('Order not found');
    
    const updatedTests = order.tests.map(test => 
      test.testId === testId ? { ...test, status } : test
    );
    
    await this.updateTestOrder(orderId, { tests: updatedTests });
  },

  // Specimens
  async createSpecimen(data: Partial<Specimen>): Promise<string> {
    const user = await getCurrentUser();
    const specimenNumber = `SPC-${Date.now()}`;
    const barcode = this.generateBarcode();
    
    const docRef = await addDoc(collection(db, SHARED_COLLECTIONS.LABFLOW_SPECIMENS), {
      ...data,
      id: generateId(),
      specimenNumber,
      barcode,
      status: 'collected',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: user?.uid
    });
    
    return docRef.id;
  },

  async getSpecimens(orderId?: string): Promise<Specimen[]> {
    const constraints = [];
    
    if (orderId) {
      constraints.push(where('orderId', '==', orderId));
    }
    
    constraints.push(orderBy('collectionDate', 'desc'));
    
    const q = query(
      collection(db, SHARED_COLLECTIONS.LABFLOW_SPECIMENS),
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Specimen));
  },

  async updateSpecimen(id: string, data: Partial<Specimen>): Promise<void> {
    const docRef = doc(db, SHARED_COLLECTIONS.LABFLOW_SPECIMENS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  async receiveSpecimen(id: string, receivedBy: string): Promise<void> {
    await this.updateSpecimen(id, {
      status: 'received',
      receivedDate: Timestamp.now(),
      receivedBy
    });
  },

  // Barcode generation
  generateBarcode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}${random}`.toUpperCase();
  },

  // Search orders
  async searchOrders(query: string): Promise<TestOrder[]> {
    // This would ideally use a full-text search solution
    // For now, we'll search by order number and patient name
    const ordersByNumber = await getDocs(
      query(
        collection(db, SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS),
        where('orderNumber', '>=', query),
        where('orderNumber', '<=', query + '\uf8ff'),
        limit(10)
      )
    );
    
    const ordersByPatient = await getDocs(
      query(
        collection(db, SHARED_COLLECTIONS.LABFLOW_TEST_ORDERS),
        where('patientName', '>=', query),
        where('patientName', '<=', query + '\uf8ff'),
        limit(10)
      )
    );
    
    const orders = [
      ...ordersByNumber.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestOrder)),
      ...ordersByPatient.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestOrder))
    ];
    
    // Remove duplicates
    const uniqueOrders = orders.filter((order, index, self) =>
      index === self.findIndex((o) => o.id === order.id)
    );
    
    return uniqueOrders;
  },

  // Get pending collections
  async getPendingCollections(): Promise<TestOrder[]> {
    return this.getTestOrders({
      status: 'pending',
      limit: 50
    });
  },

  // Get today's orders
  async getTodayOrders(): Promise<TestOrder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getTestOrders({
      dateFrom: today,
      dateTo: tomorrow
    });
  }
};