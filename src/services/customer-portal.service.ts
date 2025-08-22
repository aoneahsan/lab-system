import { db, storage } from '@/config/firebase.config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/config/firebase.config';
import { logger } from '@/services/logger.service';
import type {
  CustomerPortalAccess,
  SharedResult,
  PrescriptionUpload,
  PortalNotification,
  PortalDashboardStats,
  CustomerRegistrationData,
  ShareResultData,
  PrescriptionUploadData
} from '@/types/customer-portal.types';

const PROJECT_PREFIX = 'labflow_';
const PORTAL_ACCESS_COLLECTION = `${PROJECT_PREFIX}customer_portal_access`;
const SHARED_RESULTS_COLLECTION = `${PROJECT_PREFIX}shared_results`;
const PRESCRIPTIONS_COLLECTION = `${PROJECT_PREFIX}prescription_uploads`;
const PORTAL_NOTIFICATIONS_COLLECTION = `${PROJECT_PREFIX}portal_notifications`;

export const customerPortalService = {
  // Portal Access Management
  async createPortalAccess(data: CustomerRegistrationData): Promise<string> {
    const docRef = await addDoc(collection(db, PORTAL_ACCESS_COLLECTION), {
      patientId: data.patientId,
      email: data.email,
      isActive: true,
      canViewResults: true,
      canDownloadReports: true,
      canShareResults: true,
      canUploadPrescriptions: true,
      canBookAppointments: true,
      canViewInvoices: true,
      canMakePayments: true,
      emailVerified: false,
      preferredLanguage: 'en',
      receiveNotifications: true,
      notificationChannels: ['email'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      tenantId: auth.currentUser?.uid || ''
    });

    return docRef.id;
  },

  async getPortalAccess(patientId: string): Promise<CustomerPortalAccess | null> {
    const tenantId = auth.currentUser?.uid || '';
    const q = query(
      collection(db, PORTAL_ACCESS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId),
      where('isActive', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as CustomerPortalAccess;
  },

  async updatePortalAccess(id: string, data: Partial<CustomerPortalAccess>): Promise<void> {
    await updateDoc(doc(db, PORTAL_ACCESS_COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // Result Sharing
  async shareResult(data: ShareResultData): Promise<string> {
    const accessToken = Math.random().toString(36).substring(2, 15);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + data.expiryDays);

    const docRef = await addDoc(collection(db, SHARED_RESULTS_COLLECTION), {
      ...data,
      accessToken,
      expiresAt: Timestamp.fromDate(expiryDate),
      viewCount: 0,
      sharedBy: auth.currentUser?.uid || '',
      createdAt: serverTimestamp(),
      tenantId: auth.currentUser?.uid || ''
    });

    // Send notification based on share method
    await this.sendShareNotification(docRef.id, data);

    return docRef.id;
  },

  async getSharedResult(accessToken: string): Promise<SharedResult | null> {
    const q = query(
      collection(db, SHARED_RESULTS_COLLECTION),
      where('accessToken', '==', accessToken),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const sharedResult = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as SharedResult;

    // Check if expired
    if (sharedResult.expiresAt < new Date()) {
      return null;
    }

    // Check view limit
    if (sharedResult.maxViews && sharedResult.viewCount >= sharedResult.maxViews) {
      return null;
    }

    // Update view count and timestamp
    await updateDoc(doc(db, SHARED_RESULTS_COLLECTION, sharedResult.id), {
      viewCount: sharedResult.viewCount + 1,
      lastViewedAt: serverTimestamp(),
      firstViewedAt: sharedResult.firstViewedAt || serverTimestamp()
    });

    return sharedResult;
  },

  // Prescription Management
  async uploadPrescription(
    patientId: string, 
    data: PrescriptionUploadData
  ): Promise<string> {
    // Upload file to storage
    const fileRef = ref(
      storage, 
      `${PROJECT_PREFIX}prescriptions/${patientId}/${Date.now()}_${data.file.name}`
    );
    
    const uploadResult = await uploadBytes(fileRef, data.file);
    const fileUrl = await getDownloadURL(uploadResult.ref);

    const docRef = await addDoc(collection(db, PRESCRIPTIONS_COLLECTION), {
      patientId,
      fileName: data.file.name,
      fileUrl,
      fileSize: data.file.size,
      mimeType: data.file.type,
      doctorName: data.doctorName,
      clinicName: data.clinicName,
      prescriptionDate: data.prescriptionDate 
        ? Timestamp.fromDate(new Date(data.prescriptionDate)) 
        : null,
      notes: data.notes,
      status: 'uploaded',
      uploadedAt: serverTimestamp(),
      tenantId: auth.currentUser?.uid || ''
    });

    return docRef.id;
  },

  async getPrescriptions(patientId: string): Promise<PrescriptionUpload[]> {
    const tenantId = auth.currentUser?.uid || '';
    const q = query(
      collection(db, PRESCRIPTIONS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PrescriptionUpload));
  },

  // Notifications
  async getNotifications(patientId: string): Promise<PortalNotification[]> {
    const tenantId = auth.currentUser?.uid || '';
    const q = query(
      collection(db, PORTAL_NOTIFICATIONS_COLLECTION),
      where('tenantId', '==', tenantId),
      where('recipientId', '==', patientId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PortalNotification));
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, PORTAL_NOTIFICATIONS_COLLECTION, notificationId), {
      readAt: serverTimestamp(),
      'deliveryStatus.in_app': 'read'
    });
  },

  // Portal Dashboard
  async getPortalDashboard(patientId: string): Promise<PortalDashboardStats> {
    const tenantId = auth.currentUser?.uid || '';
    // Get results count
    const resultsQuery = query(
      collection(db, `${PROJECT_PREFIX}results`),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId)
    );
    const resultsSnapshot = await getDocs(resultsQuery);

    // Get recent results
    const recentResultsQuery = query(
      collection(db, `${PROJECT_PREFIX}results`),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const recentResultsSnapshot = await getDocs(recentResultsQuery);

    // Get upcoming appointments
    const appointmentsQuery = query(
      collection(db, `${PROJECT_PREFIX}appointments`),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId),
      where('status', 'in', ['requested', 'confirmed']),
      where('appointmentDate', '>=', Timestamp.now()),
      orderBy('appointmentDate', 'asc'),
      limit(5)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    // Get pending invoices
    const invoicesQuery = query(
      collection(db, `${PROJECT_PREFIX}invoices`),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId),
      where('status', 'in', ['sent', 'viewed', 'overdue']),
      orderBy('dueDate', 'asc'),
      limit(5)
    );
    const invoicesSnapshot = await getDocs(invoicesQuery);

    return {
      totalResults: resultsSnapshot.size,
      pendingResults: resultsSnapshot.docs.filter(
        doc => doc.data().status === 'pending'
      ).length,
      recentResults: recentResultsSnapshot.docs.map(doc => ({
        id: doc.id,
        testName: doc.data().testName,
        date: doc.data().createdAt.toDate(),
        status: doc.data().status
      })),
      upcomingAppointments: appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        date: doc.data().appointmentDate.toDate(),
        type: doc.data().type,
        location: doc.data().location?.labBranchName || 'Main Lab'
      })),
      pendingInvoices: invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        invoiceNumber: doc.data().invoiceNumber,
        amount: doc.data().balanceAmount,
        dueDate: doc.data().dueDate.toDate()
      })),
      totalSpent: 0, // Calculate from paid invoices
      lastVisit: null // Get from appointments
    };
  },

  // Helper functions
  async sendShareNotification(shareId: string, data: ShareResultData): Promise<void> {
    // Implementation would send actual notifications via email/SMS/WhatsApp
    logger.log('Sending share notification:', shareId, data);
  }
};