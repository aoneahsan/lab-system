import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getPaymentService } from '@/services/payment/paymentService';
import { PaymentMethod } from '@/types/billing';
// TODO: Use Payment type when implementing payment history
// import { Payment } from '@/types/billing';
import { PaymentStatus } from '@/config/payment';

export function usePayment() {
  const paymentService = getPaymentService();
  const [initialized, setInitialized] = useState(false);

  // Initialize payment provider
  const initializePayment = useCallback(async () => {
    if (!initialized) {
      await paymentService.initialize();
      setInitialized(true);
    }
  }, [initialized, paymentService]);

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async ({ amount, description, metadata }: {
      amount: number;
      description: string;
      metadata?: Record<string, string>;
    }) => {
      await initializePayment();
      return paymentService.createPayment(amount, description, metadata);
    },
  });

  // Process payment mutation
  const processPayment = useMutation({
    mutationFn: async ({ paymentId, paymentMethod, billingInfo }: {
      paymentId: string;
      paymentMethod: PaymentMethod;
      billingInfo: any;
    }) => {
      return paymentService.processPayment(paymentId, paymentMethod, billingInfo);
    },
  });

  // Refund payment mutation
  const refundPayment = useMutation({
    mutationFn: async ({ paymentId, amount, reason }: {
      paymentId: string;
      amount?: number;
      reason?: string;
    }) => {
      return paymentService.refundPayment(paymentId, amount, reason);
    },
  });

  return {
    createPayment,
    processPayment,
    refundPayment,
    initializePayment,
  };
}

// Hook to fetch payments
export function usePayments(filters?: {
  patientId?: string;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}) {
  const paymentService = getPaymentService();

  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentService.listPayments(filters),
  });
}

// Hook to fetch single payment
export function usePaymentDetails(paymentId: string) {
  const paymentService = getPaymentService();

  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => paymentService.getPayment(paymentId),
    enabled: !!paymentId,
  });
}