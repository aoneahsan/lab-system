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
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { getFirestoreCollectionName, COLLECTION_NAMES } from '@/config/firebase-collections-helper';
import { webhookService } from '@/services/webhook.service';
import { trackingInstance } from '@/providers/TrackingProvider';
import type {
  Patient,
  CreatePatientData,
  UpdatePatientData,
  PatientSearchFilters,
  PatientListItem,
  PatientStats,
  PatientDocument,
} from '@/types/patient.types';

// Type for Firestore timestamp fields
type FirestoreTimestamp = Timestamp | { toDate: () => Date } | Date | null | undefined;

class PatientService {
  private getCollectionName(tenantId: string): string {
    return getFirestoreCollectionName(COLLECTION_NAMES.PATIENTS, tenantId);
  }

  private generatePatientId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `P${timestamp}${random}`.toUpperCase();
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private formatPatientData(data: Record<string, unknown>): Patient {
    const toDate = (value: unknown): Date | undefined => {
      const timestamp = value as FirestoreTimestamp;
      if (!timestamp) return undefined;
      if (timestamp instanceof Date) return timestamp;
      if (timestamp instanceof Timestamp) return timestamp.toDate();
      if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        return timestamp.toDate();
      }
      return undefined;
    };

    return {
      ...data,
      dateOfBirth: toDate(data.dateOfBirth) || new Date(),
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      lastVisitDate: toDate(data.lastVisitDate),
      // Convert nested dates
      insurances:
        (data.insurances as Record<string, unknown>[] | undefined)?.map((ins) => ({
          ...ins,
          validFrom: toDate(ins.validFrom) || new Date(),
          validTo: toDate(ins.validTo),
        })) || [],
      allergies:
        (data.allergies as Record<string, unknown>[] | undefined)?.map((allergy) => ({
          ...allergy,
          confirmedDate: toDate(allergy.confirmedDate),
        })) || [],
      medications:
        (data.medications as Record<string, unknown>[] | undefined)?.map((med) => ({
          ...med,
          startDate: toDate(med.startDate) || new Date(),
          endDate: toDate(med.endDate),
        })) || [],
      medicalHistory:
        (data.medicalHistory as Record<string, unknown>[] | undefined)?.map((history) => ({
          ...history,
          diagnosedDate: toDate(history.diagnosedDate),
        })) || [],
      documents:
        (data.documents as Record<string, unknown>[] | undefined)?.map((doc) => ({
          ...doc,
          uploadedAt: toDate(doc.uploadedAt) || new Date(),
        })) || [],
      // Preserve custom fields
      customFields: data.customFields as Record<string, any> || {},
    } as Patient;
  }

  private formatPatientListItem(patient: Patient): PatientListItem {
    const primaryPhone = patient.phoneNumbers.find((p) => p.isPrimary)?.value ||
      patient.phoneNumbers[0]?.value || '';
    
    return {
      id: patient.id,
      patientId: patient.patientId,
      fullName: `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim(),
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      age: this.calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      phoneNumber: primaryPhone,
      phone: primaryPhone, // Alias for phoneNumber
      email: patient.email,
      lastVisitDate: patient.lastVisitDate,
      isActive: patient.isActive,
      isVip: patient.isVip,
    };
  }

  async createPatient(
    tenantId: string,
    data: CreatePatientData,
    createdBy: string
  ): Promise<Patient> {
    const startTime = Date.now();
    try {
      // Track patient creation attempt
      trackingInstance.trackEvent('patient_creation_started', {
        tenantId,
        createdBy,
      });
      const collectionName = this.getCollectionName(tenantId);
      const patientId = this.generatePatientId();

      const patientData = {
        ...data,
        tenantId,
        patientId,
        phoneNumbers: [
          {
            type: 'mobile' as const,
            value: data.phoneNumber,
            isPrimary: true,
            isVerified: false,
          },
        ],
        addresses: [
          {
            ...data.address,
            isDefault: true,
          },
        ],
        emergencyContacts: data.emergencyContact ? [data.emergencyContact] : [],
        allergies: [],
        medications: [],
        medicalHistory: [],
        insurances: [],
        documents: [],
        isActive: true,
        isVip: false,
        tags: [],
        totalVisits: 0,
        customFields: data.customFields || {},
        createdAt: serverTimestamp(),
        createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: createdBy,
      };

      const docRef = await addDoc(collection(firestore, collectionName), patientData);
      const newDoc = await getDoc(docRef);

      const createdPatient = this.formatPatientData({
        id: docRef.id,
        ...newDoc.data(),
      });

      // Trigger webhook event
      try {
        await webhookService.triggerWebhookEvent(tenantId, 'patient.created', {
          patient: {
            id: createdPatient.id,
            mrn: createdPatient.mrn,
            firstName: createdPatient.firstName,
            lastName: createdPatient.lastName,
            dateOfBirth: createdPatient.dateOfBirth.toISOString(),
            gender: createdPatient.gender,
            email: createdPatient.email,
            phoneNumber: createdPatient.phoneNumbers[0]?.value,
          },
        });
      } catch (webhookError) {
        console.error('Error triggering webhook:', webhookError);
        // Don't fail the patient creation if webhook fails
      }

      // Track successful patient creation
      const duration = Date.now() - startTime;
      trackingInstance.trackEvent('patient_created', {
        patientId: createdPatient.id,
        tenantId,
        createdBy,
        duration,
      });
      trackingInstance.trackMetric('patient_creation_time', duration, 'ms', {
        tenantId,
      });

      return createdPatient;
    } catch (error) {
      // Track patient creation failure
      trackingInstance.trackEvent('patient_creation_failed', {
        tenantId,
        createdBy,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      });
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async updatePatient(
    tenantId: string,
    patientId: string,
    data: UpdatePatientData
  ): Promise<Patient> {
    const startTime = Date.now();
    try {
      // Track patient update attempt
      trackingInstance.trackEvent('patient_update_started', {
        patientId,
        tenantId,
        fieldsUpdated: Object.keys(data),
      });
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, patientId);

      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      const updatedPatient = this.formatPatientData({
        id: patientId,
        ...updatedDoc.data(),
      });

      // Trigger webhook event
      try {
        await webhookService.triggerWebhookEvent(tenantId, 'patient.updated', {
          patient: {
            id: updatedPatient.id,
            mrn: updatedPatient.mrn,
            changes: data,
          },
        });
      } catch (webhookError) {
        console.error('Error triggering webhook:', webhookError);
        // Don't fail the patient update if webhook fails
      }

      // Track successful patient update
      const duration = Date.now() - startTime;
      trackingInstance.trackEvent('patient_updated', {
        patientId,
        tenantId,
        fieldsUpdated: Object.keys(data),
        duration,
      });
      trackingInstance.trackMetric('patient_update_time', duration, 'ms', {
        tenantId,
      });

      return updatedPatient;
    } catch (error) {
      // Track patient update failure
      trackingInstance.trackEvent('patient_update_failed', {
        patientId,
        tenantId,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      });
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async getPatient(tenantId: string, patientId: string): Promise<Patient | null> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, patientId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.formatPatientData({
        id: docSnap.id,
        ...docSnap.data(),
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  async searchPatients(
    tenantId: string,
    filters: PatientSearchFilters,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{
    patients: PatientListItem[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const constraints: QueryConstraint[] = [where('tenantId', '==', tenantId)];

      // Apply filters
      if (filters.isActive !== undefined) {
        constraints.push(where('isActive', '==', filters.isActive));
      }

      if (filters.gender) {
        constraints.push(where('gender', '==', filters.gender));
      }

      if (filters.bloodGroup) {
        constraints.push(where('bloodGroup', '==', filters.bloodGroup));
      }

      if (filters.isVip !== undefined) {
        constraints.push(where('isVip', '==', filters.isVip));
      }

      // Sort by created date (newest first)
      constraints.push(orderBy('createdAt', 'desc'));

      // Pagination
      constraints.push(limit(pageSize + 1));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(firestore, collectionName), ...constraints);
      const snapshot = await getDocs(q);

      const patients: PatientListItem[] = [];
      let lastDocSnapshot: DocumentSnapshot | null = null;

      snapshot.docs.slice(0, pageSize).forEach((doc) => {
        const patientData = this.formatPatientData({
          id: doc.id,
          ...doc.data(),
        });
        patients.push(this.formatPatientListItem(patientData));
        lastDocSnapshot = doc;
      });

      return {
        patients,
        lastDoc: lastDocSnapshot,
        hasMore: snapshot.docs.length > pageSize,
      };
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async getPatients(
    tenantId: string,
    options?: { limit?: number }
  ): Promise<Patient[]> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
      ];
      
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(collection(firestore, collectionName), ...constraints);
      const snapshot = await getDocs(q);
      
      const patients: Patient[] = [];
      snapshot.docs.forEach((doc) => {
        patients.push(this.formatPatientData({
          id: doc.id,
          ...doc.data(),
        }));
      });
      
      return patients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async getPatientStats(tenantId: string): Promise<PatientStats> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const q = query(collection(firestore, collectionName), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);

      const stats: PatientStats = {
        totalPatients: 0,
        activePatients: 0,
        newPatientsThisMonth: 0,
        vipPatients: 0,
        averageAge: 0,
        genderDistribution: {
          male: 0,
          female: 0,
          other: 0,
          unknown: 0,
        },
      };

      let totalAge = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        stats.totalPatients++;

        if (data.isActive) {
          stats.activePatients++;
        }

        if (data.isVip) {
          stats.vipPatients++;
        }

        if (data.gender) {
          stats.genderDistribution[data.gender as keyof typeof stats.genderDistribution]++;
        }

        if (data.dateOfBirth) {
          const dateOfBirth = data.dateOfBirth as FirestoreTimestamp;
          if (dateOfBirth instanceof Timestamp) {
            const age = this.calculateAge(dateOfBirth.toDate());
            totalAge += age;
          } else if (dateOfBirth instanceof Date) {
            const age = this.calculateAge(dateOfBirth);
            totalAge += age;
          }
        }

        if (data.createdAt) {
          const createdAt = data.createdAt as FirestoreTimestamp;
          let createdDate: Date | undefined;
          if (createdAt instanceof Timestamp) {
            createdDate = createdAt.toDate();
          } else if (createdAt instanceof Date) {
            createdDate = createdAt;
          }

          if (
            createdDate &&
            createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear
          ) {
            stats.newPatientsThisMonth++;
          }
        }
      });

      stats.averageAge = stats.totalPatients > 0 ? Math.round(totalAge / stats.totalPatients) : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      throw error;
    }
  }

  async addDocument(
    tenantId: string,
    patientId: string,
    document: Omit<PatientDocument, 'id' | 'uploadedAt'>,
    uploadedBy: string
  ): Promise<void> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, patientId);

      const patient = await this.getPatient(tenantId, patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      const newDocument: PatientDocument = {
        ...document,
        id: `DOC${Date.now()}${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
        uploadedAt: new Date(),
      };

      const documents = [...(patient.documents || []), newDocument];

      await updateDoc(docRef, {
        documents,
        updatedAt: serverTimestamp(),
        updatedBy: uploadedBy,
      });
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async deletePatient(tenantId: string, patientId: string): Promise<void> {
    try {
      const collectionName = this.getCollectionName(tenantId);
      const docRef = doc(firestore, collectionName, patientId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  async deactivatePatient(tenantId: string, patientId: string, updatedBy: string): Promise<void> {
    try {
      await this.updatePatient(tenantId, patientId, {
        isActive: false,
        updatedBy,
      });
    } catch (error) {
      console.error('Error deactivating patient:', error);
      throw error;
    }
  }

  async activatePatient(tenantId: string, patientId: string, updatedBy: string): Promise<void> {
    try {
      await this.updatePatient(tenantId, patientId, {
        isActive: true,
        updatedBy,
      });
    } catch (error) {
      console.error('Error activating patient:', error);
      throw error;
    }
  }
}

export const patientService = new PatientService();
