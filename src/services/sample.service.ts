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
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/stores/auth.store';
import type {
  Sample,
  SampleCollection,
  SampleFilter,
  SampleFormData,
  ChainOfCustodyEntry,
  SampleStatus,
} from '@/types/sample.types';

const SAMPLES_COLLECTION = 'samples';
const COLLECTIONS_COLLECTION = 'sampleCollections';

// Generate unique sample number
const generateSampleNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `S${year}${month}${day}${random}`;
};

// Generate barcode
const generateBarcode = (sampleNumber: string): string => {
  return `${sampleNumber}${Date.now().toString().slice(-6)}`;
};

export const sampleService = {
  // Get samples with filters
  async getSamples(tenantId: string, filter?: SampleFilter): Promise<Sample[]> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    let q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));

    if (filter) {
      const constraints: any[] = [];

      if (filter.status) {
        constraints.push(where('status', '==', filter.status));
      }
      if (filter.type) {
        constraints.push(where('type', '==', filter.type));
      }
      if (filter.priority) {
        constraints.push(where('priority', '==', filter.priority));
      }
      if (filter.patientId) {
        constraints.push(where('patientId', '==', filter.patientId));
      }
      if (filter.orderId) {
        constraints.push(where('orderId', '==', filter.orderId));
      }
      if (filter.collectedBy) {
        constraints.push(where('collectedBy', '==', filter.collectedBy));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      q = query(collection(db, collectionName), ...constraints);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Sample));
  },

  // Get single sample
  async getSample(tenantId: string, sampleId: string): Promise<Sample | null> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    const docRef = doc(db, collectionName, sampleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Sample;
    }
    return null;
  },

  // Create sample
  async createSample(
    tenantId: string,
    userId: string,
    data: SampleFormData
  ): Promise<Sample> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    const sampleNumber = generateSampleNumber();
    const barcode = generateBarcode(sampleNumber);

    const initialCustody: ChainOfCustodyEntry = {
      timestamp: Timestamp.now(),
      action: 'collected',
      userId,
      userName: useAuthStore.getState().currentUser?.displayName || 'Unknown',
      location: data.collectionSite,
      notes: 'Sample collected',
    };

    const sampleData = {
      ...data,
      tenantId,
      sampleNumber,
      barcode,
      status: 'collected' as SampleStatus,
      collectionDate: Timestamp.fromDate(data.collectionDate),
      chainOfCustody: [initialCustody],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, collectionName), sampleData);
    return {
      id: docRef.id,
      ...sampleData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Sample;
  },

  // Update sample
  async updateSample(
    tenantId: string,
    userId: string,
    sampleId: string,
    data: Partial<SampleFormData>
  ): Promise<void> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    const docRef = doc(db, collectionName, sampleId);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (data.collectionDate) {
      updateData.collectionDate = Timestamp.fromDate(data.collectionDate);
    }

    await updateDoc(docRef, updateData as any);
  },

  // Update sample status
  async updateSampleStatus(
    tenantId: string,
    userId: string,
    sampleId: string,
    status: SampleStatus,
    notes?: string,
    location?: string
  ): Promise<void> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    const docRef = doc(db, collectionName, sampleId);

    // Get current sample to update chain of custody
    const currentSample = await this.getSample(tenantId, sampleId);
    if (!currentSample) {
      throw new Error('Sample not found');
    }

    const custodyEntry: ChainOfCustodyEntry = {
      timestamp: Timestamp.now(),
      action: this.mapStatusToAction(status),
      userId,
      userName: useAuthStore.getState().currentUser?.displayName || 'Unknown',
      location,
      notes: notes || `Status changed to ${status}`,
    };

    const chainOfCustody = [...currentSample.chainOfCustody, custodyEntry];

    await updateDoc(docRef, {
      status,
      chainOfCustody,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  // Map status to custody action
  mapStatusToAction(status: SampleStatus): ChainOfCustodyEntry['action'] {
    const mapping: Record<SampleStatus, ChainOfCustodyEntry['action']> = {
      pending_collection: 'collected',
      collected: 'collected',
      in_transit: 'transported',
      received: 'received',
      processing: 'processed',
      stored: 'stored',
      completed: 'processed',
      rejected: 'disposed',
      expired: 'disposed',
    };
    return mapping[status] || 'processed';
  },

  // Delete sample
  async deleteSample(tenantId: string, sampleId: string): Promise<void> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    await deleteDoc(doc(db, collectionName, sampleId));
  },

  // Get sample collections
  async getSampleCollections(
    tenantId: string,
    filter?: { status?: string; phlebotomistId?: string }
  ): Promise<SampleCollection[]> {
    const collectionName = `${tenantId}_${COLLECTIONS_COLLECTION}`;
    let q = query(collection(db, collectionName), orderBy('scheduledDate', 'desc'));

    if (filter) {
      const constraints: any[] = [];

      if (filter.status) {
        constraints.push(where('status', '==', filter.status));
      }
      if (filter.phlebotomistId) {
        constraints.push(where('phlebotomistId', '==', filter.phlebotomistId));
      }

      constraints.push(orderBy('scheduledDate', 'desc'));

      q = query(collection(db, collectionName), ...constraints);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SampleCollection));
  },

  // Create sample collection
  async createSampleCollection(
    tenantId: string,
    userId: string,
    data: Omit<SampleCollection, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ): Promise<SampleCollection> {
    const collectionName = `${tenantId}_${COLLECTIONS_COLLECTION}`;

    const collectionData = {
      ...data,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, collectionName), collectionData);
    return {
      id: docRef.id,
      ...collectionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as SampleCollection;
  },

  // Complete sample collection
  async completeSampleCollection(
    tenantId: string,
    userId: string,
    collectionId: string,
    collectedSamples: { testId: string; sampleId: string }[]
  ): Promise<void> {
    const collectionName = `${tenantId}_${COLLECTIONS_COLLECTION}`;
    const docRef = doc(db, collectionName, collectionId);

    // Get current collection
    const currentCollection = await getDoc(docRef);
    if (!currentCollection.exists()) {
      throw new Error('Collection not found');
    }

    const collectionData = currentCollection.data() as SampleCollection;
    const updatedSamples = collectionData.samples.map(sample => {
      const collected = collectedSamples.find(cs => cs.testId === sample.testId);
      if (collected) {
        return {
          ...sample,
          collected: true,
          sampleId: collected.sampleId,
        };
      }
      return sample;
    });

    await updateDoc(docRef, {
      status: 'completed',
      samples: updatedSamples,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  // Batch update samples
  async batchUpdateSamples(
    tenantId: string,
    userId: string,
    sampleIds: string[],
    updates: Partial<Sample>
  ): Promise<void> {
    const collectionName = `${tenantId}_${SAMPLES_COLLECTION}`;
    const batch = writeBatch(db);

    for (const sampleId of sampleIds) {
      const docRef = doc(db, collectionName, sampleId);
      batch.update(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    }

    await batch.commit();
  },

  // Get sample statistics
  async getSampleStatistics(tenantId: string): Promise<{
    totalSamples: number;
    samplesByStatus: Record<SampleStatus, number>;
    samplesByType: Record<string, number>;
    todaysSamples: number;
    pendingSamples: number;
  }> {
    const samples = await this.getSamples(tenantId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statistics = {
      totalSamples: samples.length,
      samplesByStatus: {} as Record<SampleStatus, number>,
      samplesByType: {} as Record<string, number>,
      todaysSamples: 0,
      pendingSamples: 0,
    };

    samples.forEach(sample => {
      // Count by status
      statistics.samplesByStatus[sample.status] = 
        (statistics.samplesByStatus[sample.status] || 0) + 1;

      // Count by type
      statistics.samplesByType[sample.type] = 
        (statistics.samplesByType[sample.type] || 0) + 1;

      // Count today's samples
      const sampleDate = sample.collectionDate.toDate();
      sampleDate.setHours(0, 0, 0, 0);
      if (sampleDate.getTime() === today.getTime()) {
        statistics.todaysSamples++;
      }

      // Count pending samples
      if (['pending_collection', 'collected', 'in_transit'].includes(sample.status)) {
        statistics.pendingSamples++;
      }
    });

    return statistics;
  },
};