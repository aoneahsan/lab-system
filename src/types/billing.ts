import { PaymentStatus, ClaimStatus } from '@/config/payment';

export interface BillingInfo {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  clientSecret?: string;
}

export interface Payment {
  id: string;
  amount: number;
  processingFee: number;
  totalAmount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  patientId?: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaymentMethod {
  id?: string;
  type: 'card' | 'bank' | 'wallet' | 'insurance';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault?: boolean;
  elements?: any; // Stripe Elements
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  testId?: string;
  serviceCode?: string;
}

export interface InsuranceInfo {
  payerId: string;
  payerName: string;
  memberId: string;
  groupNumber?: string;
  planType: string;
  relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
  subscriberInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };
}

export interface InsuranceVerification {
  eligible: boolean;
  coverageActive: boolean;
  copay?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  coverageDetails?: {
    labTests?: {
      covered: boolean;
      coveragePercentage: number;
      priorAuthRequired: boolean;
    };
  };
  verifiedAt: Date;
}

export interface InsuranceClaim {
  id?: string;
  claimNumber?: string;
  patientId: string;
  payerId: string;
  memberId: string;
  dateOfService: Date;
  diagnoses: string[]; // ICD-10 codes
  procedures: ClaimProcedure[];
  totalAmount: number;
  status: ClaimStatus;
  submittedAt?: Date;
  processedAt?: Date;
  paymentAmount?: number;
  denialReason?: string;
  appealDeadline?: Date;
}

export interface ClaimProcedure {
  code: string; // CPT code
  description: string;
  quantity: number;
  amount: number;
  modifiers?: string[];
}