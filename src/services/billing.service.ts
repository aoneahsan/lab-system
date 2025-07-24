import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  // deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  // writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import type {
  Invoice,
  Payment,
  InsuranceClaim,
  InsuranceProvider,
  BillingFilter,
  BillingStatistics,
  ClaimFilter,
  ClaimStatistics,
  InvoiceFormData,
  PaymentFormData,
  ClaimFormData,
  InvoiceStatus,
  PaymentStatus,
  InsuranceEligibility,
  EligibilityCheckRequest,
  PatientInsurance,
} from '@/types/billing.types';

export const billingService = {
  // Generate invoice number
  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  },

  // Get invoices
  async getInvoices(tenantId: string, filter?: BillingFilter): Promise<Invoice[]> {
    const invoicesRef = collection(db, COLLECTIONS.INVOICES);
    let q = query(invoicesRef, where('tenantId', '==', tenantId));

    if (filter?.patientId) {
      q = query(q, where('patientId', '==', filter.patientId));
    }
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }

    q = query(q, orderBy('invoiceDate', 'desc'), limit(50));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  },

  // Get single invoice
  async getInvoice(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    
    if (!invoiceDoc.exists() || invoiceDoc.data()?.tenantId !== tenantId) {
      return null;
    }

    return { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;
  },

  // Create invoice
  async createInvoice(
    tenantId: string,
    userId: string,
    data: InvoiceFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;
    
    // Calculate totals
    let subtotal = 0;
    const items = data.items.map(item => {
      const amount = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const tax = item.tax || 0;
      const total = amount - discount + tax;
      subtotal += total;
      
      return {
        ...item,
        id: `item-${Date.now()}-${Math.random()}`,
        amount,
        total,
      };
    });

    const taxAmount = 0; // TODO: Calculate based on configuration
    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoiceData: Omit<Invoice, 'id'> = {
      tenantId,
      invoiceNumber: this.generateInvoiceNumber(),
      patientId: data.patientId,
      orderId: data.orderId,
      
      invoiceDate: now,
      dueDate: Timestamp.fromDate(data.dueDate),
      
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      balanceDue: totalAmount,
      
      status: 'draft',
      paymentStatus: 'pending',
      
      items,
      payments: [],
      
      notes: data.notes,
      
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.INVOICES), invoiceData);
    return docRef.id;
  },

  // Update invoice
  async updateInvoice(
    tenantId: string,
    userId: string,
    invoiceId: string,
    data: Partial<Invoice>
  ): Promise<void> {
    const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    
    if (!invoiceDoc.exists() || invoiceDoc.data()?.tenantId !== tenantId) {
      throw new Error('Invoice not found');
    }

    await updateDoc(invoiceRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  // Send invoice
  async sendInvoice(
    tenantId: string,
    userId: string,
    invoiceId: string
  ): Promise<void> {
    await this.updateInvoice(tenantId, userId, invoiceId, {
      status: 'sent',
    });
    
    // TODO: Implement actual email sending
  },

  // Record payment
  async recordPayment(
    tenantId: string,
    userId: string,
    data: PaymentFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;
    
    // Get invoice
    const invoice = await this.getInvoice(tenantId, data.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create payment record
    const paymentData: Omit<Payment, 'id'> = {
      tenantId,
      invoiceId: data.invoiceId,
      patientId: invoice.patientId,
      
      paymentDate: Timestamp.fromDate(data.paymentDate),
      amount: data.amount,
      method: data.method,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      
      createdAt: now,
      createdBy: userId,
    };

    const paymentRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentData);

    // Update invoice balance and status
    const newBalance = invoice.balanceDue - data.amount;
    const newStatus: PaymentStatus = newBalance <= 0 ? 'paid' : 'partial';
    
    await this.updateInvoice(tenantId, userId, data.invoiceId, {
      balanceDue: newBalance,
      paymentStatus: newStatus,
      status: newStatus === 'paid' ? 'paid' : invoice.status,
      payments: [...invoice.payments, paymentRef.id],
    });

    return paymentRef.id;
  },

  // Get payments
  async getPayments(tenantId: string, invoiceId?: string): Promise<Payment[]> {
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    let q = query(paymentsRef, where('tenantId', '==', tenantId));

    if (invoiceId) {
      q = query(q, where('invoiceId', '==', invoiceId));
    }

    q = query(q, orderBy('paymentDate', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  },

  // Create insurance claim
  async createInsuranceClaim(
    tenantId: string,
    userId: string,
    data: ClaimFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;
    
    // Get invoice
    const invoice = await this.getInvoice(tenantId, data.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate total charges
    const totalCharges = data.services.reduce((sum, service) => 
      sum + (service.units * service.charge), 0
    );

    const claimData: Omit<InsuranceClaim, 'id'> = {
      tenantId,
      invoiceId: data.invoiceId,
      patientId: invoice.patientId,
      insuranceId: data.insuranceId,
      
      claimNumber: `CLM-${Date.now()}`,
      claimDate: now,
      serviceDate: Timestamp.fromDate(data.serviceDate),
      
      // TODO: Get provider information from configuration
      providerId: '',
      renderingProvider: data.renderingProvider,
      npiNumber: '',
      taxId: '',
      
      primaryDiagnosis: data.primaryDiagnosis,
      secondaryDiagnoses: data.secondaryDiagnoses,
      
      services: data.services.map(service => ({
        ...service,
        id: `svc-${Date.now()}-${Math.random()}`,
        serviceDate: Timestamp.fromDate(data.serviceDate),
      })),
      
      totalCharges,
      
      status: 'draft',
      
      notes: data.notes,
      
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.INSURANCE_CLAIMS), claimData);
    
    // Update invoice with claim reference
    await this.updateInvoice(tenantId, userId, data.invoiceId, {
      insuranceClaimId: docRef.id,
    });

    return docRef.id;
  },

  // Submit claim
  async submitClaim(
    tenantId: string,
    userId: string,
    claimId: string
  ): Promise<void> {
    const claimRef = doc(db, COLLECTIONS.INSURANCE_CLAIMS, claimId);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists() || claimDoc.data()?.tenantId !== tenantId) {
      throw new Error('Claim not found');
    }

    await updateDoc(claimRef, {
      status: 'submitted',
      submittedDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // TODO: Implement actual claim submission
  },

  // Get insurance providers
  async getInsuranceProviders(tenantId: string): Promise<InsuranceProvider[]> {
    const providersRef = collection(db, COLLECTIONS.INSURANCE_PROVIDERS);
    const q = query(
      providersRef,
      where('tenantId', '==', tenantId),
      where('active', '==', true),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InsuranceProvider));
  },

  // Get billing statistics
  async getBillingStatistics(tenantId: string): Promise<BillingStatistics> {
    const invoicesRef = collection(db, COLLECTIONS.INVOICES);
    const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
    const claimsRef = collection(db, COLLECTIONS.INSURANCE_CLAIMS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all invoices
    const invoicesQuery = query(invoicesRef, where('tenantId', '==', tenantId));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    
    // Get today's data
    const todayTimestamp = Timestamp.fromDate(today);
    const todaysInvoicesQuery = query(
      invoicesRef,
      where('tenantId', '==', tenantId),
      where('invoiceDate', '>=', todayTimestamp)
    );
    const todaysPaymentsQuery = query(
      paymentsRef,
      where('tenantId', '==', tenantId),
      where('paymentDate', '>=', todayTimestamp)
    );
    
    const [todaysInvoicesSnapshot, todaysPaymentsSnapshot] = await Promise.all([
      getDocs(todaysInvoicesQuery),
      getDocs(todaysPaymentsQuery),
    ]);

    // Calculate statistics
    let totalRevenue = 0;
    let pendingPayments = 0;
    let overdueAmount = 0;
    let todaysCharges = 0;
    let todaysPayments = 0;

    const invoicesByStatus: Record<InvoiceStatus, number> = {
      draft: 0,
      sent: 0,
      viewed: 0,
      paid: 0,
      partial: 0,
      overdue: 0,
      cancelled: 0,
    };

    invoicesSnapshot.docs.forEach(doc => {
      const invoice = doc.data() as Invoice;
      invoicesByStatus[invoice.status]++;
      totalRevenue += invoice.totalAmount;
      
      if (invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'partial') {
        pendingPayments += invoice.balanceDue;
      }
      
      if (invoice.paymentStatus === 'overdue') {
        overdueAmount += invoice.balanceDue;
      }
    });

    todaysInvoicesSnapshot.docs.forEach(doc => {
      const invoice = doc.data() as Invoice;
      todaysCharges += invoice.totalAmount;
    });

    todaysPaymentsSnapshot.docs.forEach(doc => {
      const payment = doc.data() as Payment;
      todaysPayments += payment.amount;
    });

    // Get claims statistics
    const claimsQuery = query(claimsRef, where('tenantId', '==', tenantId));
    const claimsSnapshot = await getDocs(claimsQuery);
    
    const claimsByStatus = {
      draft: 0,
      submitted: 0,
      pending: 0,
      approved: 0,
      denied: 0,
      partial: 0,
      paid: 0,
      appealed: 0,
    };

    claimsSnapshot.docs.forEach(doc => {
      const claim = doc.data() as InsuranceClaim;
      claimsByStatus[claim.status]++;
    });

    return {
      totalInvoices: invoicesSnapshot.size,
      totalRevenue,
      pendingPayments,
      overdueAmount,
      todaysCharges,
      todaysPayments,
      invoicesByStatus,
      paymentsByMethod: {
        cash: 0,
        credit_card: 0,
        debit_card: 0,
        check: 0,
        insurance: 0,
        eft: 0,
        other: 0,
      }, // TODO: Calculate from payments
      claimsByStatus,
      averagePaymentTime: 15, // TODO: Calculate actual average
      collectionRate: totalRevenue > 0 ? ((totalRevenue - pendingPayments) / totalRevenue) * 100 : 0,
    };
  },

  // Get insurance claims
  async getClaims(tenantId: string, filter?: ClaimFilter): Promise<InsuranceClaim[]> {
    const claimsRef = collection(db, COLLECTIONS.INSURANCE_CLAIMS);
    let q = query(claimsRef, where('tenantId', '==', tenantId));

    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }
    if (filter?.insuranceProviderId) {
      q = query(q, where('insuranceId', '==', filter.insuranceProviderId));
    }
    if (filter?.patientId) {
      q = query(q, where('patientId', '==', filter.patientId));
    }

    q = query(q, orderBy('claimDate', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InsuranceClaim));
  },

  // Get single claim
  async getClaim(tenantId: string, claimId: string): Promise<InsuranceClaim | null> {
    const claimRef = doc(db, COLLECTIONS.INSURANCE_CLAIMS, claimId);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists() || claimDoc.data()?.tenantId !== tenantId) {
      return null;
    }

    return { id: claimDoc.id, ...claimDoc.data() } as InsuranceClaim;
  },

  // Get claim statistics
  async getClaimStatistics(tenantId: string): Promise<ClaimStatistics> {
    const claimsRef = collection(db, COLLECTIONS.INSURANCE_CLAIMS);
    const q = query(claimsRef, where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);

    let totalClaims = 0;
    let pendingClaims = 0;
    let acceptedAmount = 0;
    let rejectedClaims = 0;
    let totalProcessingDays = 0;
    let processedClaims = 0;

    const providerStats: Record<string, {
      claimCount: number;
      acceptedCount: number;
      totalReimbursement: number;
    }> = {};

    snapshot.docs.forEach(doc => {
      const claim = doc.data() as InsuranceClaim;
      totalClaims++;

      if (claim.status === 'pending' || claim.status === 'submitted') {
        pendingClaims++;
      }
      if (claim.status === 'denied') {
        rejectedClaims++;
      }
      if (claim.paidAmount) {
        acceptedAmount += claim.paidAmount;
      }

      // Calculate processing time
      if (claim.submittedDate && claim.processedDate) {
        const submittedDate = claim.submittedDate.toDate();
        const processedDate = claim.processedDate.toDate();
        const daysDiff = Math.floor((processedDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
        totalProcessingDays += daysDiff;
        processedClaims++;
      }

      // Track provider stats
      if (!providerStats[claim.insuranceId]) {
        providerStats[claim.insuranceId] = {
          claimCount: 0,
          acceptedCount: 0,
          totalReimbursement: 0,
        };
      }
      providerStats[claim.insuranceId].claimCount++;
      if (claim.status === 'approved' || claim.status === 'paid') {
        providerStats[claim.insuranceId].acceptedCount++;
        providerStats[claim.insuranceId].totalReimbursement += claim.paidAmount || 0;
      }
    });

    const rejectionRate = totalClaims > 0 ? (rejectedClaims / totalClaims) * 100 : 0;
    const averageProcessingDays = processedClaims > 0 ? totalProcessingDays / processedClaims : 0;

    const topInsuranceProviders = Object.entries(providerStats)
      .map(([providerId, stats]) => ({
        provider: providerId, // TODO: Get provider name
        claimCount: stats.claimCount,
        acceptanceRate: stats.claimCount > 0 ? (stats.acceptedCount / stats.claimCount) * 100 : 0,
        averageReimbursement: stats.acceptedCount > 0 ? stats.totalReimbursement / stats.acceptedCount : 0,
      }))
      .sort((a, b) => b.claimCount - a.claimCount)
      .slice(0, 5);

    return {
      totalClaims,
      pendingClaims,
      acceptedAmount,
      rejectionRate,
      averageProcessingDays,
      topInsuranceProviders,
    };
  },

  // Create insurance claim helper
  async createClaim(tenantId: string, userId: string, data: ClaimFormData): Promise<string> {
    return this.createInsuranceClaim(tenantId, userId, data);
  },

  // Appeal claim
  async appealClaim(
    tenantId: string,
    userId: string,
    claimId: string,
    appealReason: string,
    additionalDocuments?: string
  ): Promise<void> {
    const claimRef = doc(db, COLLECTIONS.INSURANCE_CLAIMS, claimId);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists() || claimDoc.data()?.tenantId !== tenantId) {
      throw new Error('Claim not found');
    }

    await updateDoc(claimRef, {
      status: 'appealing',
      appealDate: serverTimestamp(),
      appealReason,
      additionalDocuments,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  // Get patient insurance
  async getPatientInsurance(tenantId: string, patientId: string): Promise<PatientInsurance[]> {
    const insuranceRef = collection(db, COLLECTIONS.PATIENT_INSURANCE);
    const q = query(
      insuranceRef,
      where('patientId', '==', patientId),
      where('active', '==', true),
      orderBy('insuranceType')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PatientInsurance));
  },

  // Check insurance eligibility
  async checkEligibility(
    tenantId: string,
    userId: string,
    request: EligibilityCheckRequest
  ): Promise<InsuranceEligibility> {
    // In a real implementation, this would call an external eligibility API
    // For demo purposes, we'll simulate the check
    
    const eligibilityData: Omit<InsuranceEligibility, 'id'> = {
      tenantId,
      patientId: request.patientId,
      insuranceProviderId: request.insuranceProviderId,
      memberNumber: request.memberNumber,
      groupNumber: request.groupNumber,
      checkDate: Timestamp.now(),
      status: 'active', // Simulated response
      coverage: {
        medical: true,
        dental: false,
        vision: false,
        lab: true,
      },
      deductible: {
        individual: 2000,
        individualMet: 750,
        family: 4000,
        familyMet: 1200,
      },
      outOfPocketMax: {
        individual: 5000,
        individualMet: 1000,
        family: 10000,
        familyMet: 2500,
      },
      copay: {
        primaryCare: 25,
        specialist: 50,
        lab: 20,
        emergency: 150,
      },
      coinsurance: {
        inNetwork: 20,
        outOfNetwork: 40,
      },
      effectiveDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 0, 1)),
      responseMessage: 'Coverage verified successfully',
      createdAt: Timestamp.now(),
      createdBy: userId,
    };

    // Store the eligibility check result
    const eligibilityRef = collection(db, COLLECTIONS.INSURANCE_ELIGIBILITY);
    const docRef = await addDoc(eligibilityRef, eligibilityData);

    return {
      id: docRef.id,
      ...eligibilityData,
    };
  },

  // Get eligibility history
  async getEligibilityHistory(
    tenantId: string,
    patientId: string,
    limitCount: number = 10
  ): Promise<InsuranceEligibility[]> {
    const eligibilityRef = collection(db, COLLECTIONS.INSURANCE_ELIGIBILITY);
    const q = query(
      eligibilityRef,
      where('patientId', '==', patientId),
      orderBy('checkDate', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InsuranceEligibility));
  },
};