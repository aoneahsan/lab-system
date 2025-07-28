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

  // Process claim response from insurance
  async processClaimResponse(
    tenantId: string,
    userId: string,
    claimId: string,
    response: {
      status: 'approved' | 'denied' | 'partial' | 'pending';
      approvedAmount?: number;
      deniedAmount?: number;
      allowedAmount?: number;
      patientResponsibility?: number;
      paymentAmount?: number;
      paymentDate?: Date;
      eobNumber?: string;
      adjustmentReason?: string;
      denialReason?: string;
      notes?: string;
    }
  ): Promise<void> {
    const claimRef = doc(db, COLLECTIONS.INSURANCE_CLAIMS, claimId);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists() || claimDoc.data()?.tenantId !== tenantId) {
      throw new Error('Claim not found');
    }

    const updateData: any = {
      status: response.status,
      processedDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (response.approvedAmount !== undefined) {
      updateData.approvedAmount = response.approvedAmount;
    }
    if (response.deniedAmount !== undefined) {
      updateData.deniedAmount = response.deniedAmount;
    }
    if (response.allowedAmount !== undefined) {
      updateData.allowedAmount = response.allowedAmount;
    }
    if (response.patientResponsibility !== undefined) {
      updateData.patientResponsibility = response.patientResponsibility;
    }
    if (response.paymentAmount !== undefined) {
      updateData.paymentAmount = response.paymentAmount;
    }
    if (response.paymentDate) {
      updateData.paymentDate = Timestamp.fromDate(response.paymentDate);
    }
    if (response.eobNumber) {
      updateData.eobNumber = response.eobNumber;
    }
    if (response.adjustmentReason) {
      updateData.adjustmentReason = response.adjustmentReason;
    }
    if (response.denialReason) {
      updateData.denialReason = response.denialReason;
    }
    if (response.notes) {
      updateData.responseNotes = response.notes;
    }

    await updateDoc(claimRef, updateData);

    // If payment was received, create a payment record
    if (response.paymentAmount && response.paymentAmount > 0) {
      const claim = claimDoc.data() as InsuranceClaim;
      await this.createPayment(tenantId, userId, {
        invoiceId: claim.invoiceId,
        amount: response.paymentAmount,
        paymentDate: response.paymentDate || new Date(),
        method: 'insurance',
        referenceNumber: response.eobNumber,
        insuranceClaimId: claimId,
        notes: `Insurance payment for claim ${claim.claimNumber}`,
      });
    }

    // Create audit log
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      tenantId,
      entityType: 'insurance_claim',
      entityId: claimId,
      action: 'claim_response_processed',
      performedBy: userId,
      timestamp: Timestamp.now(),
      details: response,
    });
  },

  // Appeal denied claim
  async appealClaim(
    tenantId: string,
    userId: string,
    claimId: string,
    appealData: {
      appealReason: string;
      supportingDocuments?: string[];
      additionalNotes?: string;
    }
  ): Promise<void> {
    const claimRef = doc(db, COLLECTIONS.INSURANCE_CLAIMS, claimId);
    const claimDoc = await getDoc(claimRef);
    
    if (!claimDoc.exists() || claimDoc.data()?.tenantId !== tenantId) {
      throw new Error('Claim not found');
    }

    const claim = claimDoc.data() as InsuranceClaim;
    if (claim.status !== 'denied' && claim.status !== 'partial') {
      throw new Error('Only denied or partial claims can be appealed');
    }

    await updateDoc(claimRef, {
      status: 'appealed',
      appealDate: serverTimestamp(),
      appealReason: appealData.appealReason,
      appealDocuments: appealData.supportingDocuments || [],
      appealNotes: appealData.additionalNotes,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Create audit log
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      tenantId,
      entityType: 'insurance_claim',
      entityId: claimId,
      action: 'claim_appealed',
      performedBy: userId,
      timestamp: Timestamp.now(),
      details: appealData,
    });
  },

  // Batch claim submission
  async submitBatchClaims(
    tenantId: string,
    userId: string,
    claimIds: string[]
  ): Promise<{ submitted: string[]; failed: string[] }> {
    const submitted: string[] = [];
    const failed: string[] = [];

    for (const claimId of claimIds) {
      try {
        await this.submitClaim(tenantId, userId, claimId);
        submitted.push(claimId);
      } catch {
        failed.push(claimId);
      }
    }

    return { submitted, failed };
  },

  // Generate claim form (CMS-1500 or UB-04)
  async generateClaimForm(
    tenantId: string,
    claimId: string,
    formType: 'CMS1500' | 'UB04'
  ): Promise<any> {
    const claim = await this.getClaim(tenantId, claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    // TODO: Implement actual form generation
    // This would typically generate a PDF or EDI file
    return {
      formType,
      claimId,
      generatedAt: new Date(),
      // Form data would be populated here
    };
  },

  // Check claim status with insurance
  async checkClaimStatus(
    _tenantId: string,
    _claimId: string
  ): Promise<{
    status: string;
    lastChecked: Date;
    message: string;
  }> {
    // TODO: Implement actual insurance API integration
    // This is a mock implementation
    return {
      status: 'pending',
      lastChecked: new Date(),
      message: 'Claim is being processed by insurance',
    };
  },

  // Payment tracking and reconciliation features
  
  // Get payment history for a patient
  async getPaymentHistory(
    tenantId: string,
    patientId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    payments: Payment[];
    totalPaid: number;
    paymentMethods: Record<string, number>;
  }> {
    // Get all invoices for the patient
    const invoicesQuery = query(
      collection(db, COLLECTIONS.INVOICES),
      where('tenantId', '==', tenantId),
      where('patientId', '==', patientId)
    );
    const invoicesSnapshot = await getDocs(invoicesQuery);
    const invoiceIds = invoicesSnapshot.docs.map(doc => doc.id);

    if (invoiceIds.length === 0) {
      return { payments: [], totalPaid: 0, paymentMethods: {} };
    }

    // Get payments for those invoices
    let paymentsQuery = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('tenantId', '==', tenantId),
      where('invoiceId', 'in', invoiceIds)
    );

    if (dateRange) {
      paymentsQuery = query(
        paymentsQuery,
        where('paymentDate', '>=', Timestamp.fromDate(dateRange.start)),
        where('paymentDate', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    paymentsQuery = query(paymentsQuery, orderBy('paymentDate', 'desc'));

    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));

    // Calculate totals
    let totalPaid = 0;
    const paymentMethods: Record<string, number> = {};

    payments.forEach(payment => {
      totalPaid += payment.amount;
      paymentMethods[payment.method] = (paymentMethods[payment.method] || 0) + payment.amount;
    });

    return { payments, totalPaid, paymentMethods };
  },

  // Reconcile payments with bank deposits
  async reconcileDeposit(
    tenantId: string,
    userId: string,
    reconciliationData: {
      depositDate: Date;
      depositAmount: number;
      bankReference: string;
      paymentIds: string[];
      notes?: string;
    }
  ): Promise<string> {
    // Verify all payments exist and calculate total
    let totalPaymentAmount = 0;
    const payments = [];

    for (const paymentId of reconciliationData.paymentIds) {
      const paymentRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
      const paymentDoc = await getDoc(paymentRef);
      
      if (!paymentDoc.exists() || paymentDoc.data()?.tenantId !== tenantId) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      const payment = paymentDoc.data() as Payment;
      if (payment.reconciledDate) {
        throw new Error(`Payment ${paymentId} is already reconciled`);
      }

      totalPaymentAmount += payment.amount;
      payments.push({ id: paymentId, ...payment });
    }

    // Check if amounts match
    const difference = Math.abs(totalPaymentAmount - reconciliationData.depositAmount);
    if (difference > 0.01) {
      throw new Error(`Payment total ($${totalPaymentAmount}) does not match deposit amount ($${reconciliationData.depositAmount})`);
    }

    // Create reconciliation record
    const reconciliationRef = await addDoc(collection(db, COLLECTIONS.PAYMENT_RECONCILIATIONS), {
      tenantId,
      depositDate: Timestamp.fromDate(reconciliationData.depositDate),
      depositAmount: reconciliationData.depositAmount,
      bankReference: reconciliationData.bankReference,
      paymentIds: reconciliationData.paymentIds,
      paymentTotal: totalPaymentAmount,
      difference: 0,
      status: 'reconciled',
      notes: reconciliationData.notes,
      reconciledBy: userId,
      reconciledAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    // Update payments as reconciled
    const updatePromises = reconciliationData.paymentIds.map(paymentId =>
      updateDoc(doc(db, COLLECTIONS.PAYMENTS, paymentId), {
        reconciledDate: serverTimestamp(),
        reconciliationId: reconciliationRef.id,
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return reconciliationRef.id;
  },

  // Get unreconciled payments
  async getUnreconciledPayments(
    tenantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<Payment[]> {
    let q = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('tenantId', '==', tenantId),
      where('reconciledDate', '==', null)
    );

    if (dateRange) {
      q = query(
        q,
        where('paymentDate', '>=', Timestamp.fromDate(dateRange.start)),
        where('paymentDate', '<=', Timestamp.fromDate(dateRange.end))
      );
    }

    q = query(q, orderBy('paymentDate', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  },

  // Payment plan management
  async createPaymentPlan(
    tenantId: string,
    userId: string,
    planData: {
      patientId: string;
      invoiceIds: string[];
      totalAmount: number;
      downPayment: number;
      numberOfInstallments: number;
      installmentAmount: number;
      startDate: Date;
      notes?: string;
    }
  ): Promise<string> {
    const installments = [];
    const currentDate = new Date(planData.startDate);

    for (let i = 0; i < planData.numberOfInstallments; i++) {
      installments.push({
        installmentNumber: i + 1,
        dueDate: Timestamp.fromDate(new Date(currentDate)),
        amount: planData.installmentAmount,
        status: 'pending',
        paidAmount: 0,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const paymentPlanRef = await addDoc(collection(db, COLLECTIONS.PAYMENT_PLANS), {
      tenantId,
      patientId: planData.patientId,
      invoiceIds: planData.invoiceIds,
      totalAmount: planData.totalAmount,
      downPayment: planData.downPayment,
      remainingBalance: planData.totalAmount - planData.downPayment,
      numberOfInstallments: planData.numberOfInstallments,
      installmentAmount: planData.installmentAmount,
      installments,
      status: 'active',
      startDate: Timestamp.fromDate(planData.startDate),
      notes: planData.notes,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update invoices to reference payment plan
    const updatePromises = planData.invoiceIds.map(invoiceId =>
      updateDoc(doc(db, COLLECTIONS.INVOICES, invoiceId), {
        paymentPlanId: paymentPlanRef.id,
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return paymentPlanRef.id;
  },

  // Record payment plan installment
  async recordInstallmentPayment(
    tenantId: string,
    userId: string,
    paymentPlanId: string,
    installmentNumber: number,
    paymentData: {
      amount: number;
      paymentDate: Date;
      method: string;
      referenceNumber?: string;
    }
  ): Promise<void> {
    const planRef = doc(db, COLLECTIONS.PAYMENT_PLANS, paymentPlanId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists() || planDoc.data()?.tenantId !== tenantId) {
      throw new Error('Payment plan not found');
    }

    const plan = planDoc.data();
    const installments = [...plan.installments];
    const installmentIndex = installmentNumber - 1;

    if (installmentIndex < 0 || installmentIndex >= installments.length) {
      throw new Error('Invalid installment number');
    }

    // Update installment
    installments[installmentIndex].paidAmount += paymentData.amount;
    installments[installmentIndex].paidDate = Timestamp.fromDate(paymentData.paymentDate);
    installments[installmentIndex].status = 
      installments[installmentIndex].paidAmount >= installments[installmentIndex].amount 
        ? 'paid' 
        : 'partial';

    // Calculate new remaining balance
    const totalPaid = installments.reduce((sum, inst) => sum + inst.paidAmount, 0) + plan.downPayment;
    const remainingBalance = plan.totalAmount - totalPaid;

    // Update plan status
    const allPaid = installments.every(inst => inst.status === 'paid');
    const planStatus = allPaid ? 'completed' : 'active';

    await updateDoc(planRef, {
      installments,
      remainingBalance,
      status: planStatus,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Create payment record
    // Note: This would typically also create a payment record linked to the invoices
  },

  // Get payment analytics
  async getPaymentAnalytics(
    tenantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalCollected: number;
    averagePaymentTime: number;
    paymentMethodBreakdown: Record<string, number>;
    topPayingPatients: Array<{ patientId: string; totalPaid: number }>;
    collectionRate: number;
    monthlyTrend: Array<{ month: string; collected: number; billed: number }>;
  }> {
    // Get all payments in date range
    const paymentsQuery = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('tenantId', '==', tenantId),
      where('paymentDate', '>=', Timestamp.fromDate(dateRange.start)),
      where('paymentDate', '<=', Timestamp.fromDate(dateRange.end))
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));

    // Calculate analytics
    let totalCollected = 0;
    const paymentMethodBreakdown: Record<string, number> = {};
    const patientPayments: Record<string, number> = {};

    payments.forEach(payment => {
      totalCollected += payment.amount;
      paymentMethodBreakdown[payment.method] = 
        (paymentMethodBreakdown[payment.method] || 0) + payment.amount;
      patientPayments[payment.patientId] = 
        (patientPayments[payment.patientId] || 0) + payment.amount;
    });

    // Get top paying patients
    const topPayingPatients = Object.entries(patientPayments)
      .map(([patientId, totalPaid]) => ({ patientId, totalPaid }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);

    // TODO: Calculate actual average payment time, collection rate, and monthly trends
    // This would require correlating with invoice creation dates

    return {
      totalCollected,
      averagePaymentTime: 15, // days - placeholder
      paymentMethodBreakdown,
      topPayingPatients,
      collectionRate: 85, // percentage - placeholder
      monthlyTrend: [], // placeholder
    };
  },
};