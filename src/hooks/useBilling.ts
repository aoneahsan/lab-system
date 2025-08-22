import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import { logger } from '@/services/logger.service';
import type {
  Invoice,
  BillingFilter,
  ClaimFilter,
  InvoiceFormData,
  PaymentFormData,
  ClaimFormData,
  EligibilityCheckRequest,
} from '@/types/billing.types';

// Query keys
const BILLING_KEYS = {
  all: ['billing'] as const,
  invoices: () => [...BILLING_KEYS.all, 'invoices'] as const,
  invoice: (filter?: BillingFilter) => [...BILLING_KEYS.invoices(), filter] as const,
  invoiceDetail: (id: string) => [...BILLING_KEYS.invoices(), id] as const,
  payments: () => [...BILLING_KEYS.all, 'payments'] as const,
  payment: (invoiceId?: string) => [...BILLING_KEYS.payments(), invoiceId] as const,
  claims: () => [...BILLING_KEYS.all, 'claims'] as const,
  claim: (id: string) => [...BILLING_KEYS.claims(), id] as const,
  providers: () => [...BILLING_KEYS.all, 'providers'] as const,
  statistics: () => [...BILLING_KEYS.all, 'statistics'] as const,
};

// Get invoices
export const useInvoices = (filter?: BillingFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: BILLING_KEYS.invoice(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getInvoices(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

// Get single invoice
export const useInvoice = (invoiceId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: BILLING_KEYS.invoiceDetail(invoiceId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getInvoice(currentTenant.id, invoiceId);
    },
    enabled: !!currentTenant && !!invoiceId,
  });
};

// Create invoice
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: InvoiceFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.createInvoice(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.statistics() });
      toast.success('Invoice created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create invoice');
      logger.error('Error creating invoice:', error);
    },
  });
};

// Update invoice
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: Partial<Invoice> }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.updateInvoice(currentTenant.id, currentUser.id, invoiceId, data);
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoiceDetail(invoiceId) });
      toast.success('Invoice updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update invoice');
      logger.error('Error updating invoice:', error);
    },
  });
};

// Send invoice
export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (invoiceId: string) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.sendInvoice(currentTenant.id, currentUser.id, invoiceId);
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoiceDetail(invoiceId) });
      toast.success('Invoice sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send invoice');
      logger.error('Error sending invoice:', error);
    },
  });
};

// Record payment
export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: PaymentFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.recordPayment(currentTenant.id, currentUser.id, data);
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoiceDetail(data.invoiceId) });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.payments() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.statistics() });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record payment');
      logger.error('Error recording payment:', error);
    },
  });
};

// Get payments
export const usePayments = (invoiceId?: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: BILLING_KEYS.payment(invoiceId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getPayments(currentTenant.id, invoiceId);
    },
    enabled: !!currentTenant,
  });
};

// Create insurance claim
export const useCreateInsuranceClaim = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: ClaimFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.createInsuranceClaim(currentTenant.id, currentUser.id, data);
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.claims() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.invoiceDetail(data.invoiceId) });
      toast.success('Insurance claim created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create insurance claim');
      logger.error('Error creating claim:', error);
    },
  });
};

// Submit claim
export const useSubmitClaim = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (claimId: string) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.submitClaim(currentTenant.id, currentUser.id, claimId);
    },
    onSuccess: (_, claimId) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.claims() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.claim(claimId) });
      toast.success('Claim submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit claim');
      logger.error('Error submitting claim:', error);
    },
  });
};

// Get insurance providers
export const useInsuranceProviders = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: BILLING_KEYS.providers(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getInsuranceProviders(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};

// Get billing statistics
export const useBillingStatistics = (startDate?: Date, endDate?: Date) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: [...BILLING_KEYS.statistics(), startDate, endDate],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getBillingStatistics(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};

// Get insurance claims
export const useClaims = (filter?: ClaimFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: [...BILLING_KEYS.claims(), filter],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getClaims(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

// Get claim statistics
export const useClaimStatistics = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: [...BILLING_KEYS.claims(), 'statistics'],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getClaimStatistics(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};

// Get single claim
export const useClaim = (claimId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: BILLING_KEYS.claim(claimId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getClaim(currentTenant.id, claimId);
    },
    enabled: !!currentTenant && !!claimId,
  });
};

// Appeal claim
export const useAppealClaim = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      claimId,
      appealReason,
      additionalDocuments,
    }: {
      claimId: string;
      appealReason: string;
      additionalDocuments?: string;
    }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.appealClaim(
        currentTenant.id,
        currentUser.id,
        claimId,
        appealReason,
        additionalDocuments
      );
    },
    onSuccess: (_, { claimId }) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.claims() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.claim(claimId) });
      toast.success('Appeal submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit appeal');
      logger.error('Error submitting appeal:', error);
    },
  });
};

// Get patient insurance
export const usePatientInsurance = (patientId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['patient-insurance', currentTenant?.id, patientId],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getPatientInsurance(currentTenant.id, patientId);
    },
    enabled: !!currentTenant && !!patientId,
  });
};

// Check insurance eligibility
export const useCheckEligibility = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (request: EligibilityCheckRequest) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return billingService.checkEligibility(currentTenant.id, currentUser.id, request);
    },
    onSuccess: (_, request) => {
      queryClient.invalidateQueries({
        queryKey: ['eligibility-history', currentTenant?.id, request.patientId],
      });
      toast.success('Eligibility check completed');
    },
    onError: (error) => {
      toast.error('Failed to check eligibility');
      logger.error('Error checking eligibility:', error);
    },
  });
};

// Get eligibility history
export const useEligibilityHistory = (patientId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: ['eligibility-history', currentTenant?.id, patientId],
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return billingService.getEligibilityHistory(currentTenant.id, patientId);
    },
    enabled: !!currentTenant && !!patientId,
  });
};
