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
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { Appointment, AppointmentSlot, AppointmentSettings } from '@/types/appointment.types';
import { getTenantSpecificCollectionName } from '@/utils/tenant.utils';

class AppointmentService {
  // Create appointment
  async createAppointment(tenantId: string, data: Partial<Appointment>): Promise<string> {
    const appointmentsCollection = getTenantSpecificCollectionName('appointments', tenantId);
    
    const appointment = {
      ...data,
      scheduledDate: Timestamp.fromDate(data.scheduledDate as Date),
      status: 'scheduled',
      remindersSent: {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      tenantId,
    };

    const docRef = await addDoc(collection(firestore, appointmentsCollection), appointment);
    return docRef.id;
  }

  // Get appointment by ID
  async getAppointment(tenantId: string, appointmentId: string): Promise<Appointment | null> {
    const appointmentsCollection = getTenantSpecificCollectionName('appointments', tenantId);
    const docRef = doc(firestore, appointmentsCollection, appointmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      scheduledDate: data.scheduledDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Appointment;
  }

  // Get appointments with filters
  async getAppointments(
    tenantId: string,
    filters: {
      patientId?: string;
      locationId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<Appointment[]> {
    const appointmentsCollection = getTenantSpecificCollectionName('appointments', tenantId);
    let q = query(collection(firestore, appointmentsCollection), where('tenantId', '==', tenantId));

    if (filters.patientId) {
      q = query(q, where('patientId', '==', filters.patientId));
    }
    if (filters.locationId) {
      q = query(q, where('locationId', '==', filters.locationId));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.dateFrom) {
      q = query(q, where('scheduledDate', '>=', Timestamp.fromDate(filters.dateFrom)));
    }
    if (filters.dateTo) {
      q = query(q, where('scheduledDate', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    q = query(q, orderBy('scheduledDate', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledDate: data.scheduledDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Appointment;
    });
  }

  // Update appointment
  async updateAppointment(
    tenantId: string,
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<void> {
    const appointmentsCollection = getTenantSpecificCollectionName('appointments', tenantId);
    const docRef = doc(firestore, appointmentsCollection, appointmentId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  // Cancel appointment
  async cancelAppointment(
    tenantId: string,
    appointmentId: string,
    reason?: string
  ): Promise<void> {
    await this.updateAppointment(tenantId, appointmentId, {
      status: 'cancelled',
      notes: reason,
    });
  }

  // Check in patient
  async checkInPatient(tenantId: string, appointmentId: string): Promise<void> {
    await this.updateAppointment(tenantId, appointmentId, {
      status: 'in-progress',
      checkInTime: new Date(),
    });
  }

  // Complete appointment
  async completeAppointment(tenantId: string, appointmentId: string): Promise<void> {
    await this.updateAppointment(tenantId, appointmentId, {
      status: 'completed',
      checkOutTime: new Date(),
    });
  }

  // Get available slots
  async getAvailableSlots(
    tenantId: string,
    locationId: string,
    date: Date,
    appointmentType: 'regular' | 'home-collection' = 'regular'
  ): Promise<AppointmentSlot[]> {
    // This would typically query a slots collection or calculate based on settings
    // For now, returning mock data
    const slots: AppointmentSlot[] = [];
    const startHour = 8;
    const endHour = 17;
    const slotDuration = 30; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endTime = `${hour.toString().padStart(2, '0')}:${(minute + slotDuration).toString().padStart(2, '0')}`;
        
        slots.push({
          id: `${date.toISOString().split('T')[0]}-${startTime}`,
          locationId,
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          capacity: appointmentType === 'home-collection' ? 1 : 5,
          booked: 0,
          available: appointmentType === 'home-collection' ? 1 : 5,
          type: appointmentType,
          isActive: true,
        });
      }
    }

    return slots;
  }

  // Get appointment settings
  async getAppointmentSettings(tenantId: string): Promise<AppointmentSettings | null> {
    const settingsCollection = getTenantSpecificCollectionName('settings', tenantId);
    const docRef = doc(firestore, settingsCollection, 'appointments');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as AppointmentSettings;
  }

  // Update appointment settings
  async updateAppointmentSettings(
    tenantId: string,
    settings: Partial<AppointmentSettings>
  ): Promise<void> {
    const settingsCollection = getTenantSpecificCollectionName('settings', tenantId);
    const docRef = doc(firestore, settingsCollection, 'appointments');
    
    await updateDoc(docRef, {
      ...settings,
      updatedAt: Timestamp.now(),
    });
  }
}

export const appointmentService = new AppointmentService();