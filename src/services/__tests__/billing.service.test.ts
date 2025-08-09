import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { billingService } from '../billing.service';
import { db, storage } from '@/config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { settingsService } from '../settings';
import { notificationService } from '../notification.service';
import { patientService } from '../patient.service';
import type { Invoice, Payment } from '@/types/billing.types';

// Mock Firebase modules
vi.mock('firebase/firestore');
vi.mock('firebase/storage');
vi.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
}));
vi.mock('../settings');
vi.mock('../notification.service');
vi.mock('../patient.service');

describe('BillingService', () => {
  const mockTenantId = 'tenant1';
  const mockUserId = 'user1';
  
  const mockInvoice: Invoice = {
    id: 'invoice1',
    tenantId: mockTenantId,
    invoiceNumber: 'INV-2025-001',
    patientId: 'patient1',
    orderId: 'order1',
    items: [
      {
        id: 'item1',
        description: 'Blood Test',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        testCode: 'BT001',
        testName: 'Complete Blood Count',
      }
    ],
    subtotal: 100,
    taxAmount: 10,
    discountAmount: 0,
    totalAmount: 110,
    status: 'pending',
    dueDate: Timestamp.fromDate(new Date('2025-02-01')),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: mockUserId,
  };

  const mockPayment: Payment = {
    id: 'payment1',
    tenantId: mockTenantId,
    invoiceId: 'invoice1',
    amount: 110,
    method: 'credit_card',
    status: 'completed',
    transactionId: 'txn_123',
    processedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockBillingSettings = {
    taxEnabled: true,
    taxRate: 10,
    defaultPaymentTerms: 30,
  };

  const mockGeneralSettings = {
    labName: 'Test Lab',
    npiNumber: '1234567890',
    taxId: '12-3456789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsService.getSettingSection).mockImplementation(async (section) => {
      if (section === 'billing') return mockBillingSettings;
      if (section === 'general') return mockGeneralSettings;
      return {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInvoice', () => {
    it('should create invoice with tax calculation', async () => {
      const mockDocRef = { id: 'new-invoice-id' };
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockInvoice, id: mockDocRef.id }),
      } as any);
      vi.mocked(patientService.getPatient).mockResolvedValue({
        id: 'patient1',
        email: 'patient@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      const invoiceData = {
        patientId: 'patient1',
        orderId: 'order1',
        items: mockInvoice.items,
      };

      const result = await billingService.createInvoice(mockTenantId, mockUserId, invoiceData);

      expect(settingsService.getSettingSection).toHaveBeenCalledWith('billing');
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_invoices'),
        expect.objectContaining({
          taxAmount: 10, // 10% of 100
          totalAmount: 110,
        })
      );
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        'email',
        'patient@example.com',
        'invoice_sent',
        expect.any(Object)
      );
      expect(result).toEqual(expect.objectContaining({ id: mockDocRef.id }));
    });

    it('should create invoice without tax when disabled', async () => {
      vi.mocked(settingsService.getSettingSection).mockResolvedValue({
        ...mockBillingSettings,
        taxEnabled: false,
      });
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-invoice-id' } as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockInvoice, taxAmount: 0, totalAmount: 100 }),
      } as any);

      const invoiceData = {
        patientId: 'patient1',
        orderId: 'order1',
        items: mockInvoice.items,
      };

      await billingService.createInvoice(mockTenantId, mockUserId, invoiceData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_invoices'),
        expect.objectContaining({
          taxAmount: 0,
          totalAmount: 100,
        })
      );
    });
  });

  describe('createInsuranceClaim', () => {
    it('should create insurance claim with provider info', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'claim1' } as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockInvoice,
      } as any);

      const claimData = {
        invoiceId: 'invoice1',
        insuranceProviderId: 'provider1',
        policyNumber: 'POL123',
        groupNumber: 'GRP456',
        diagnosisCodes: ['Z00.00'],
        authorizationNumber: 'AUTH789',
        providerNPI: mockGeneralSettings.npiNumber!,
        providerTaxId: mockGeneralSettings.taxId!,
      };

      const result = await billingService.createInsuranceClaim(mockTenantId, mockUserId, claimData);

      expect(settingsService.getSettingSection).toHaveBeenCalledWith('general');
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_insurance_claims'),
        expect.objectContaining({
          providerNPI: '1234567890',
          providerTaxId: '12-3456789',
          formData: expect.objectContaining({
            providerInfo: expect.objectContaining({
              npi: '1234567890',
              taxId: '12-3456789',
            }),
          }),
        })
      );
      expect(result).toBe('claim1');
    });
  });

  describe('submitClaimToInsurance', () => {
    it('should submit claim and create audit log', async () => {
      const mockClaim = {
        id: 'claim1',
        status: 'draft',
        insuranceProviderId: 'provider1',
      };
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockClaim,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(addDoc).mockResolvedValue({ id: 'audit1' } as any);

      await billingService.submitClaimToInsurance(mockTenantId, mockUserId, 'claim1');

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'labflow_insurance_claims', 'claim1'),
        expect.objectContaining({
          status: 'submitted',
          submittedAt: expect.any(Object),
        })
      );
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_audit_logs'),
        expect.objectContaining({
          entityType: 'insurance_claim',
          action: 'submitted',
          details: expect.objectContaining({
            claimId: 'claim1',
            apiStatus: 'sent',
          }),
        })
      );
    });
  });

  describe('getBillingAnalytics', () => {
    it('should calculate comprehensive billing analytics', async () => {
      const mockInvoices = [
        { ...mockInvoice, totalAmount: 100, status: 'paid' },
        { ...mockInvoice, id: 'inv2', totalAmount: 200, status: 'pending' },
        { ...mockInvoice, id: 'inv3', totalAmount: 150, status: 'paid' },
      ];

      const mockPayments = [
        { ...mockPayment, amount: 100, method: 'credit_card', processedAt: Timestamp.fromDate(new Date('2025-01-15')) },
        { ...mockPayment, id: 'pay2', amount: 150, method: 'cash', processedAt: Timestamp.fromDate(new Date('2025-01-20')) },
      ];

      vi.mocked(getDocs).mockImplementation(async (q) => {
        const queryStr = q.toString();
        if (queryStr.includes('labflow_invoices')) {
          return {
            docs: mockInvoices.map((inv) => ({
              id: inv.id,
              data: () => inv,
            })),
            size: mockInvoices.length,
          } as any;
        }
        if (queryStr.includes('labflow_payments')) {
          return {
            docs: mockPayments.map((pay) => ({
              id: pay.id,
              data: () => pay,
            })),
            size: mockPayments.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      const analytics = await billingService.getBillingAnalytics(mockTenantId, 'thisMonth');

      expect(analytics).toEqual(expect.objectContaining({
        totalRevenue: 450,
        totalCollected: 250,
        totalPending: 200,
        averageInvoiceAmount: 150,
        collectionRate: expect.any(Number),
        paymentMethodBreakdown: expect.arrayContaining([
          expect.objectContaining({ method: 'credit_card' }),
          expect.objectContaining({ method: 'cash' }),
        ]),
        topInsuranceProviders: expect.any(Array),
        monthlyTrend: expect.any(Array),
      }));
      expect(analytics.collectionRate).toBeCloseTo(55.56, 1);
    });
  });

  describe('generateInvoicePDF', () => {
    it('should generate PDF and upload to storage', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockInvoice,
      } as any);
      vi.mocked(patientService.getPatient).mockResolvedValue({
        id: 'patient1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      } as any);
      vi.mocked(uploadBytes).mockResolvedValue({} as any);
      vi.mocked(getDownloadURL).mockResolvedValue('https://storage.url/invoice.pdf');

      const url = await billingService.generateInvoicePDF(mockTenantId, 'invoice1');

      expect(uploadBytes).toHaveBeenCalledWith(
        ref(storage, `labflow/${mockTenantId}/invoices/invoice1.pdf`),
        expect.any(Blob)
      );
      expect(url).toBe('https://storage.url/invoice.pdf');
    });
  });

  describe('processPayment', () => {
    it('should process payment and update invoice status', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockInvoice,
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'payment1' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const paymentData = {
        invoiceId: 'invoice1',
        amount: 110,
        method: 'credit_card' as const,
        transactionId: 'txn_123',
      };

      const result = await billingService.processPayment(mockTenantId, mockUserId, paymentData);

      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'labflow_payments'),
        expect.objectContaining({
          amount: 110,
          method: 'credit_card',
          status: 'completed',
        })
      );
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'labflow_invoices', 'invoice1'),
        expect.objectContaining({
          status: 'paid',
          paidAmount: 110,
        })
      );
      expect(result).toBe('payment1');
    });

    it('should handle partial payment', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockInvoice,
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'payment1' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const paymentData = {
        invoiceId: 'invoice1',
        amount: 50,
        method: 'cash' as const,
      };

      await billingService.processPayment(mockTenantId, mockUserId, paymentData);

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'labflow_invoices', 'invoice1'),
        expect.objectContaining({
          status: 'partial',
          paidAmount: 50,
        })
      );
    });
  });
});