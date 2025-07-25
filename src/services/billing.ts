import { api } from './api';

export interface Bill {
  billId: string;
  billNumber: string;
  patientId: string;
  orderId: string;
  type: 'patient' | 'insurance' | 'corporate';
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  items: BillItem[];
  totals: BillTotals;
  insurance?: InsuranceInfo;
  payments: Payment[];
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  testId: string;
  testCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface BillTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  authorizationCode?: string;
  coverageAmount: number;
  copay: number;
  deductible: number;
  claimStatus?: 'pending' | 'approved' | 'denied' | 'partial';
}

export interface Payment {
  paymentId: string;
  amount: number;
  method: 'cash' | 'card' | 'check' | 'online' | 'insurance';
  reference: string;
  receivedAt: Date;
  receivedBy: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PaymentTransaction {
  transactionId: string;
  billId: string;
  patientId: string;
  amount: number;
  method: 'cash' | 'card' | 'check' | 'online' | 'insurance';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway?: {
    provider: string;
    transactionId: string;
    authCode: string;
    response: any;
  };
  refund?: {
    amount: number;
    reason: string;
    refundedAt: Date;
    refundedBy: string;
  };
  metadata?: any;
  createdAt: Date;
  processedAt?: Date;
}

export interface InsuranceClaim {
  claimId: string;
  billId: string;
  patientId: string;
  provider: string;
  policyNumber: string;
  claimNumber: string;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied' | 'partial';
  claimAmount: number;
  approvedAmount?: number;
  denialReason?: string;
  submittedAt?: Date;
  processedAt?: Date;
  documents: string[];
}

export interface InvoiceData {
  invoiceNumber: string;
  patient: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  items: BillItem[];
  totals: BillTotals;
  dueDate: Date;
  notes?: string;
}

class BillingService {
  // Bills
  async getBills(filters?: {
    status?: string;
    type?: string;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ bills: Bill[]; total: number }> {
    const response = await api.get('/api/billing', { params: filters });
    return response.data;
  }

  async getBillById(billId: string): Promise<Bill> {
    const response = await api.get(`/api/billing/${billId}`);
    return response.data;
  }

  async createBill(data: Partial<Bill>): Promise<Bill> {
    const response = await api.post('/api/billing', data);
    return response.data;
  }

  async updateBill(billId: string, data: Partial<Bill>): Promise<Bill> {
    const response = await api.put(`/api/billing/${billId}`, data);
    return response.data;
  }

  async calculateTotals(items: BillItem[]): Promise<BillTotals> {
    const response = await api.post('/api/billing/calculate', { items });
    return response.data;
  }

  // Payments
  async processPayment(payment: {
    billId: string;
    amount: number;
    method: Payment['method'];
    reference?: string;
    cardDetails?: {
      number: string;
      expiry: string;
      cvv: string;
      name: string;
    };
  }): Promise<PaymentTransaction> {
    const response = await api.post('/api/billing/payment', payment);
    return response.data;
  }

  async getPaymentHistory(billId: string): Promise<Payment[]> {
    const response = await api.get(`/api/billing/${billId}/payments`);
    return response.data;
  }

  async refundPayment(transactionId: string, data: {
    amount: number;
    reason: string;
  }): Promise<PaymentTransaction> {
    const response = await api.post(`/api/billing/payment/${transactionId}/refund`, data);
    return response.data;
  }

  // Insurance
  async submitInsuranceClaim(claim: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
    const response = await api.post('/api/billing/insurance/claim', claim);
    return response.data;
  }

  async getInsuranceClaims(filters?: {
    status?: string;
    provider?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<InsuranceClaim[]> {
    const response = await api.get('/api/billing/insurance/claims', { params: filters });
    return response.data;
  }

  async verifyInsurance(data: {
    provider: string;
    policyNumber: string;
    patientInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
    };
  }): Promise<{
    verified: boolean;
    coverage: any;
    eligibility: any;
  }> {
    const response = await api.post('/api/billing/insurance/verify', data);
    return response.data;
  }

  // Invoices
  async generateInvoice(billId: string): Promise<Blob> {
    const response = await api.get(`/api/billing/${billId}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async emailInvoice(billId: string, email: string): Promise<void> {
    await api.post(`/api/billing/${billId}/invoice/email`, { email });
  }

  async printInvoice(billId: string): Promise<void> {
    const blob = await this.generateInvoice(billId);
    const url = window.URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 1000);
    };
  }

  // Reports
  async getRevenueSummary(period: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month';
  }): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    data: Array<{
      date: string;
      revenue: number;
      payments: number;
      count: number;
    }>;
  }> {
    const response = await api.get('/api/billing/reports/revenue', { params: period });
    return response.data;
  }

  async getOutstandingBalances(filters?: {
    minAmount?: number;
    daysOverdue?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    bills: Bill[];
    total: number;
    totalAmount: number;
  }> {
    const response = await api.get('/api/billing/reports/outstanding', { params: filters });
    return response.data;
  }

  async getPaymentSummary(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    total: number;
    refunds: number;
  }> {
    const response = await api.get('/api/billing/reports/payments', { params: period });
    return response.data;
  }

  // Utilities
  async applyDiscount(billId: string, discount: {
    type: 'percentage' | 'amount';
    value: number;
    reason: string;
    approvedBy?: string;
  }): Promise<Bill> {
    const response = await api.post(`/api/billing/${billId}/discount`, discount);
    return response.data;
  }

  async createPaymentPlan(billId: string, plan: {
    installments: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    startDate: Date;
  }): Promise<{
    planId: string;
    schedule: Array<{
      dueDate: Date;
      amount: number;
    }>;
  }> {
    const response = await api.post(`/api/billing/${billId}/payment-plan`, plan);
    return response.data;
  }

  async sendPaymentReminder(billId: string, method: 'email' | 'sms'): Promise<void> {
    await api.post(`/api/billing/${billId}/reminder`, { method });
  }

  async exportBillingData(filters: {
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> {
    const response = await api.get('/api/billing/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const billingService = new BillingService();