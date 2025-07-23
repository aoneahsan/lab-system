import type { Timestamp } from 'firebase/firestore';

export type PaymentStatus = 
  | 'pending'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'check'
  | 'insurance'
  | 'eft'
  | 'other';

export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

export type ClaimStatus = 
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'denied'
  | 'partial'
  | 'paid'
  | 'appealed';

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  patientId: string;
  orderId?: string;
  
  // Dates
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  
  // Financial
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  balanceDue: number;
  
  // Status
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  
  // Line Items
  items: InvoiceItem[];
  
  // Payment Information
  payments: Payment[];
  
  // Insurance
  insuranceClaimId?: string;
  insuranceCoveredAmount?: number;
  patientResponsibility?: number;
  
  // Notes
  notes?: string;
  internalNotes?: string;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface InvoiceItem {
  id: string;
  testId?: string;
  testCode: string;
  testName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  discount?: number;
  tax?: number;
  total: number;
  cptCode?: string;
  icdCodes?: string[];
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  patientId: string;
  
  paymentDate: Timestamp;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  
  // Credit Card Details (encrypted)
  cardLastFour?: string;
  cardType?: string;
  
  // Check Details
  checkNumber?: string;
  bankName?: string;
  
  // Insurance Details
  insuranceClaimId?: string;
  eobNumber?: string; // Explanation of Benefits
  
  notes?: string;
  
  createdAt: Timestamp;
  createdBy: string;
}

export interface InsuranceProvider {
  id: string;
  tenantId: string;
  
  name: string;
  payerId: string;
  
  // Contact Information
  phone: string;
  fax?: string;
  email?: string;
  website?: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Billing Information
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Configuration
  requiresAuth: boolean;
  requiresReferral: boolean;
  electronicClaims: boolean;
  
  active: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InsurancePlan {
  id: string;
  tenantId: string;
  providerId: string;
  
  planName: string;
  planType: 'PPO' | 'HMO' | 'EPO' | 'POS' | 'HDHP' | 'Other';
  groupNumber?: string;
  
  // Coverage
  coveragePercentage: number;
  deductible: number;
  deductibleMet: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
  
  // Co-pay/Co-insurance
  copayAmount?: number;
  coinsurancePercentage?: number;
  
  active: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PatientInsurance {
  id: string;
  tenantId: string;
  patientId: string;
  
  insuranceType: 'primary' | 'secondary' | 'tertiary';
  providerId: string;
  planId?: string;
  
  // Policy Information
  policyNumber: string;
  groupNumber?: string;
  
  // Subscriber Information
  subscriberName: string;
  subscriberDOB: Date;
  subscriberRelation: 'self' | 'spouse' | 'child' | 'other';
  
  // Coverage Dates
  effectiveDate: Date;
  expirationDate?: Date;
  
  // Verification
  verified: boolean;
  verifiedDate?: Timestamp;
  verifiedBy?: string;
  
  active: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InsuranceClaim {
  id: string;
  tenantId: string;
  invoiceId: string;
  patientId: string;
  insuranceId: string;
  
  claimNumber: string;
  claimDate: Timestamp;
  serviceDate: Timestamp;
  
  // Provider Information
  providerId: string;
  renderingProvider: string;
  npiNumber: string;
  taxId: string;
  
  // Diagnosis
  primaryDiagnosis: string;
  secondaryDiagnoses?: string[];
  
  // Services
  services: ClaimService[];
  
  // Financial
  totalCharges: number;
  allowedAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  writeOffAmount?: number;
  
  // Status
  status: ClaimStatus;
  submittedDate?: Timestamp;
  processedDate?: Timestamp;
  
  // Response
  payerClaimNumber?: string;
  denialReason?: string;
  denialCode?: string;
  eobReceived?: boolean;
  
  // Appeal
  appealDate?: Timestamp;
  appealReason?: string;
  appealStatus?: 'pending' | 'approved' | 'denied';
  
  notes?: string;
  
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface ClaimService {
  id: string;
  serviceDate: Timestamp;
  cptCode: string;
  modifiers?: string[];
  units: number;
  charge: number;
  allowedAmount?: number;
  paidAmount?: number;
  deniedAmount?: number;
  coinsurance?: number;
  copay?: number;
  deductible?: number;
  notes?: string;
}

export interface BillingFilter {
  patientId?: string;
  status?: InvoiceStatus | PaymentStatus | ClaimStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  insuranceProviderId?: string;
}

export interface BillingStatistics {
  totalInvoices: number;
  totalRevenue: number;
  pendingPayments: number;
  overdueAmount: number;
  
  todaysCharges: number;
  todaysPayments: number;
  
  invoicesByStatus: Record<InvoiceStatus, number>;
  paymentsByMethod: Record<PaymentMethod, number>;
  claimsByStatus: Record<ClaimStatus, number>;
  
  averagePaymentTime: number; // in days
  collectionRate: number; // percentage
}

export interface InvoiceFormData {
  patientId: string;
  orderId?: string;
  dueDate: Date;
  items: Omit<InvoiceItem, 'id'>[];
  notes?: string;
  discountAmount?: number;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
}

export interface ClaimFormData {
  invoiceId: string;
  insuranceId: string;
  serviceDate: Date;
  primaryDiagnosis: string;
  secondaryDiagnoses?: string[];
  services: Omit<ClaimService, 'id'>[];
  renderingProvider: string;
  notes?: string;
}