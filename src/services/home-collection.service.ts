import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import type {
  HomeCollection,
  HomeCollectionFilters,
  HomeCollectionFormData,
  CollectionRoute,
  RouteAssignmentData,
  CollectionKit,
  PhlebotomistLocation
} from '@/types/home-collection.types';

const PROJECT_PREFIX = 'labflow_';
const COLLECTION_NAME = `${PROJECT_PREFIX}home_collections`;
const ROUTES_COLLECTION = `${PROJECT_PREFIX}collection_routes`;
const KITS_COLLECTION = `${PROJECT_PREFIX}collection_kits`;
const LOCATIONS_COLLECTION = `${PROJECT_PREFIX}phlebotomist_locations`;

export const homeCollectionService = {
  // Home Collections CRUD
  async createHomeCollection(data: HomeCollectionFormData): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      scheduledDate: Timestamp.fromDate(new Date(data.scheduledDate)),
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      tenantId: user.uid // In production, get from user profile
    });

    return docRef.id;
  },

  async updateHomeCollection(id: string, data: Partial<HomeCollection>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async getHomeCollection(id: string): Promise<HomeCollection | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as HomeCollection;
  },

  async getHomeCollections(filters: HomeCollectionFilters = {}): Promise<HomeCollection[]> {
    let q = query(collection(db, COLLECTION_NAME));

    if (filters.status?.length) {
      q = query(q, where('status', 'in', filters.status));
    }

    if (filters.phlebotomistId) {
      q = query(q, where('phlebotomistId', '==', filters.phlebotomistId));
    }

    if (filters.dateFrom) {
      q = query(q, where('scheduledDate', '>=', Timestamp.fromDate(filters.dateFrom)));
    }

    if (filters.dateTo) {
      q = query(q, where('scheduledDate', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    q = query(q, orderBy('scheduledDate', 'desc'), limit(100));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HomeCollection));
  },

  // Route Management
  async createRoute(data: RouteAssignmentData): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, ROUTES_COLLECTION), {
      ...data,
      date: Timestamp.fromDate(new Date(data.date)),
      status: 'assigned',
      totalCollections: data.collectionIds.length,
      completedCollections: 0,
      optimized: data.optimize,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      tenantId: user.uid
    });

    // Update collections with route assignment
    const batch = writeBatch(db);
    data.collectionIds.forEach((collectionId, index) => {
      const collectionRef = doc(db, COLLECTION_NAME, collectionId);
      batch.update(collectionRef, {
        routeId: docRef.id,
        phlebotomistId: data.phlebotomistId,
        sequenceNumber: index + 1,
        status: 'assigned',
        assignedAt: serverTimestamp()
      });
    });
    await batch.commit();

    return docRef.id;
  },

  async updateRoute(id: string, data: Partial<CollectionRoute>): Promise<void> {
    const docRef = doc(db, ROUTES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async getRoute(id: string): Promise<CollectionRoute | null> {
    const docRef = doc(db, ROUTES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as CollectionRoute;
  },

  async getRoutes(phlebotomistId?: string, date?: Date): Promise<CollectionRoute[]> {
    let q = query(collection(db, ROUTES_COLLECTION));

    if (phlebotomistId) {
      q = query(q, where('phlebotomistId', '==', phlebotomistId));
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      q = query(q, 
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );
    }

    q = query(q, orderBy('date', 'desc'), limit(50));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CollectionRoute));
  },

  // Kit Management
  async getAvailableKits(): Promise<CollectionKit[]> {
    const q = query(
      collection(db, KITS_COLLECTION),
      where('status', '==', 'available'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CollectionKit));
  },

  async assignKit(kitId: string, phlebotomistId: string, routeId: string): Promise<void> {
    const docRef = doc(db, KITS_COLLECTION, kitId);
    await updateDoc(docRef, {
      status: 'assigned',
      assignedTo: phlebotomistId,
      assignedDate: serverTimestamp(),
      routeId,
      updatedAt: serverTimestamp()
    });
  },

  async returnKit(kitId: string): Promise<void> {
    const docRef = doc(db, KITS_COLLECTION, kitId);
    const kitDoc = await getDoc(docRef);
    
    if (!kitDoc.exists()) throw new Error('Kit not found');
    
    const kitData = kitDoc.data();
    
    await updateDoc(docRef, {
      status: 'available',
      assignedTo: null,
      assignedDate: null,
      routeId: null,
      checkInHistory: [...(kitData.checkInHistory || []), {
        phlebotomistId: kitData.assignedTo,
        action: 'checked-in',
        timestamp: new Date()
      }],
      updatedAt: serverTimestamp()
    });
  },

  // Location Tracking
  async updatePhlebotomistLocation(
    phlebotomistId: string,
    coordinates: { latitude: number; longitude: number },
    status: PhlebotomistLocation['status'],
    currentCollectionId?: string
  ): Promise<void> {
    const locationData: Partial<PhlebotomistLocation> = {
      phlebotomistId,
      timestamp: new Date(),
      coordinates,
      status,
      currentCollectionId,
      isOnline: true
    };

    // Use phlebotomistId as document ID for easy updates
    const docRef = doc(db, LOCATIONS_COLLECTION, phlebotomistId);
    await updateDoc(docRef, locationData).catch(async () => {
      // If document doesn't exist, create it
      await addDoc(collection(db, LOCATIONS_COLLECTION), {
        id: phlebotomistId,
        ...locationData
      });
    });
  },

  async getPhlebotomistLocation(phlebotomistId: string): Promise<PhlebotomistLocation | null> {
    const docRef = doc(db, LOCATIONS_COLLECTION, phlebotomistId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as PhlebotomistLocation;
  },

  // Status Updates
  async updateCollectionStatus(
    collectionId: string,
    status: HomeCollection['status'],
    notes?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (notes) updates.notes = notes;

    // Add timestamp for specific statuses
    switch (status) {
      case 'in-transit':
        updates.departedAt = serverTimestamp();
        break;
      case 'arrived':
        updates.arrivedAt = serverTimestamp();
        break;
      case 'collecting':
        updates.collectionStartedAt = serverTimestamp();
        break;
      case 'completed':
        updates.collectionCompletedAt = serverTimestamp();
        break;
    }

    await updateDoc(doc(db, COLLECTION_NAME, collectionId), updates);

    // Update route progress if completed
    if (status === 'completed') {
      const collection = await this.getHomeCollection(collectionId);
      if (collection?.routeId) {
        await updateDoc(doc(db, ROUTES_COLLECTION, collection.routeId), {
          completedCollections: increment(1),
          updatedAt: serverTimestamp()
        });
      }
    }
  },

  // Sample Collection
  async recordSampleCollection(
    collectionId: string,
    samples: Array<{ sampleId: string; tubeType: string }>
  ): Promise<void> {
    const collectedSamples = samples.map(sample => ({
      ...sample,
      collectedAt: new Date()
    }));

    await updateDoc(doc(db, COLLECTION_NAME, collectionId), {
      sampleIds: samples.map(s => s.sampleId),
      collectedSamples,
      status: 'completed',
      collectionCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  // Payment Collection
  async recordPayment(
    collectionId: string,
    amount: number,
    paymentMethod: HomeCollection['paymentMethod']
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, collectionId), {
      amount,
      paymentMethod,
      paymentStatus: 'collected',
      paymentCollectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
};