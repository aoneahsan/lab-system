import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { getFirestoreCollectionName, COLLECTION_NAMES } from '@/config/firebase-collections-helper';
import { offlineAwareService } from './offline-aware.service';
import type {
  Patient,
  CreatePatientData,
  UpdatePatientData,
  PatientSearchFilters,
} from '@/types/patient.types';

class PatientOfflineService {
  private getCollectionName(tenantId: string): string {
    return getFirestoreCollectionName(COLLECTION_NAMES.PATIENTS, tenantId);
  }

  private generatePatientId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `P${timestamp}${random}`.toUpperCase();
  }

  // Create patient with offline support
  async createPatient(tenantId: string, data: CreatePatientData): Promise<Patient> {
    const patientId = this.generatePatientId();
    const collectionName = this.getCollectionName(tenantId);

    const patientData = {
      ...data,
      patientId,
      tenantId,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    return offlineAwareService.execute({
      collection: collectionName,
      tenantId,
      operation: 'create',
      data: patientData,
      onlineHandler: async () => {
        const docRef = await addDoc(collection(firestore, collectionName), patientData);
        return {
          id: docRef.id,
          ...patientData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as Patient;
      },
    });
  }

  // Get patient with offline support
  async getPatient(tenantId: string, patientId: string): Promise<Patient | null> {
    const collectionName = this.getCollectionName(tenantId);

    return offlineAwareService.execute({
      collection: collectionName,
      tenantId,
      operation: 'read',
      id: patientId,
      onlineHandler: async () => {
        const docRef = doc(firestore, collectionName, patientId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          return null;
        }

        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Patient;
      },
    });
  }

  // Search patients with offline support
  async searchPatients(tenantId: string, filters: PatientSearchFilters = {}): Promise<Patient[]> {
    const collectionName = this.getCollectionName(tenantId);

    return offlineAwareService.execute({
      collection: collectionName,
      tenantId,
      operation: 'read',
      filters,
      onlineHandler: async () => {
        const constraints: any[] = [];

        if (filters.searchTerm) {
          // In a real implementation, you might use a search index
          // For now, we'll do client-side filtering
        }

        if (filters.gender) {
          constraints.push(where('gender', '==', filters.gender));
        }

        if (filters.active !== undefined) {
          constraints.push(where('active', '==', filters.active));
        }

        constraints.push(orderBy('createdAt', 'desc'));

        if (filters.limit) {
          constraints.push(limit(filters.limit));
        }

        const q = query(collection(firestore, collectionName), ...constraints);
        const snapshot = await getDocs(q);

        let patients = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Patient
        );

        // Client-side filtering for search term
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          patients = patients.filter(
            (p) =>
              p.firstName.toLowerCase().includes(searchLower) ||
              p.lastName.toLowerCase().includes(searchLower) ||
              p.patientId.toLowerCase().includes(searchLower) ||
              p.email?.toLowerCase().includes(searchLower) ||
              p.phone?.includes(filters.searchTerm)
          );
        }

        return patients;
      },
    });
  }

  // Update patient with offline support
  async updatePatient(tenantId: string, patientId: string, data: UpdatePatientData): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);

    const updates = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    return offlineAwareService.execute({
      collection: collectionName,
      tenantId,
      operation: 'update',
      id: patientId,
      data: updates,
      onlineHandler: async () => {
        const docRef = doc(firestore, collectionName, patientId);
        await updateDoc(docRef, updates);
      },
    });
  }

  // Delete patient with offline support
  async deletePatient(tenantId: string, patientId: string): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);

    return offlineAwareService.execute({
      collection: collectionName,
      tenantId,
      operation: 'delete',
      id: patientId,
      onlineHandler: async () => {
        const docRef = doc(firestore, collectionName, patientId);
        await deleteDoc(docRef);
      },
    });
  }

  // Soft delete (deactivate) patient with offline support
  async deactivatePatient(tenantId: string, patientId: string): Promise<void> {
    return this.updatePatient(tenantId, patientId, { active: false });
  }

  // Get patient statistics with offline support
  async getPatientStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byGender: Record<string, number>;
  }> {
    const patients = await this.searchPatients(tenantId);

    const stats = {
      total: patients.length,
      active: 0,
      inactive: 0,
      byGender: {} as Record<string, number>,
    };

    patients.forEach((patient) => {
      if (patient.active) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      const gender = patient.gender || 'unknown';
      stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;
    });

    return stats;
  }

  // Batch create patients with offline support
  async batchCreatePatients(
    tenantId: string,
    patientsData: CreatePatientData[]
  ): Promise<Patient[]> {
    const operations = patientsData.map((data) => ({
      collection: this.getCollectionName(tenantId),
      tenantId,
      operation: 'create' as const,
      data: {
        ...data,
        patientId: this.generatePatientId(),
        tenantId,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      onlineHandler: async () => {
        const patientData = {
          ...data,
          patientId: this.generatePatientId(),
          tenantId,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(
          collection(firestore, this.getCollectionName(tenantId)),
          patientData
        );

        return {
          id: docRef.id,
          ...patientData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as Patient;
      },
    }));

    return offlineAwareService.executeBatch(operations);
  }
}

export const patientOfflineService = new PatientOfflineService();
