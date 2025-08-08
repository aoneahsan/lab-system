import { paymentConfig, calculateProcessingFee, PaymentStatus } from '@/config/payment';
import * as stripeService from './stripeService';
import { BillingInfo, Payment, PaymentMethod } from '@/types/billing';

// Payment service factory
export class PaymentService {
  private provider: string;

  constructor(provider: string = paymentConfig.provider) {
    this.provider = provider;
  }

  // Initialize payment provider
  async initialize(): Promise<any> {
    switch (this.provider) {
      case 'stripe':
        return stripeService.initializeStripe();
      case 'paypal':
        // Initialize PayPal
        return this.initializePayPal();
      case 'square':
        // Initialize Square
        return this.initializeSquare();
      default:
        throw new Error(`Unsupported payment provider: ${this.provider}`);
    }
  }

  // Create payment
  async createPayment(
    amount: number,
    description: string,
    metadata?: Record<string, string>
  ): Promise<Payment> {
    const processingFee = calculateProcessingFee(amount);
    const totalAmount = amount + processingFee;

    switch (this.provider) {
      case 'stripe': {
        const intent = await stripeService.createPaymentIntent(
          totalAmount,
          paymentConfig.currency,
          metadata
        );
        return {
          id: intent.id,
          amount,
          processingFee,
          totalAmount,
          currency: paymentConfig.currency,
          status: this.mapStripeStatus(intent.status),
          description,
          metadata,
          createdAt: new Date(),
        };
      }
      default:
        throw new Error(`Create payment not implemented for: ${this.provider}`);
    }
  }

  // Process payment
  async processPayment(
    paymentId: string,
    paymentMethod: PaymentMethod,
    billingInfo: BillingInfo
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      switch (this.provider) {
        case 'stripe': {
          const stripe = await stripeService.initializeStripe();
          if (!stripe) {
            return { success: false, error: 'Failed to initialize Stripe' };
          }

          // Process based on payment method type
          if (paymentMethod.type === 'card') {
            const result = await stripeService.processCardPayment(
              stripe,
              paymentMethod.elements!,
              billingInfo
            );
            
            if (result.error) {
              return { success: false, error: result.error.message };
            }

            return {
              success: true,
              payment: {
                id: result.paymentIntent!.id,
                amount: result.paymentIntent!.amount / 100,
                status: this.mapStripeStatus(result.paymentIntent!.status),
                currency: result.paymentIntent!.currency,
                createdAt: new Date(),
              } as Payment,
            };
          }
          break;
        }
        default:
          return { success: false, error: `Payment processing not implemented for: ${this.provider}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }

    return { success: false, error: 'Invalid payment method' };
  }

  // Refund payment
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refund?: any; error?: string }> {
    try {
      switch (this.provider) {
        case 'stripe': {
          const refund = await stripeService.processRefund(paymentId, amount, reason);
          return { success: true, refund };
        }
        default:
          return { success: false, error: `Refund not implemented for: ${this.provider}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }

  // Get payment details
  async getPayment(paymentId: string): Promise<Payment | null> {
    // Fetch from database
    const response = await fetch(`/api/payments/${paymentId}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  }

  // List payments
  async listPayments(filters?: {
    patientId?: string;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

    const response = await fetch(`/api/payments?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    return response.json();
  }

  // Initialize PayPal
  private async initializePayPal(): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${paymentConfig.paymentUrls.paypal[paymentConfig.environment]}?client-id=${paymentConfig.publicKey}&currency=${paymentConfig.currency}`;
      script.addEventListener('load', () => {
        if ((window as any).paypal) {
          resolve((window as any).paypal);
        } else {
          reject(new Error('PayPal SDK failed to load'));
        }
      });
      script.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')));
      document.head.appendChild(script);
    });
  }

  // Initialize Square
  private async initializeSquare(): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = paymentConfig.paymentUrls.square[paymentConfig.environment];
      script.addEventListener('load', async () => {
        if ((window as any).Square) {
          const payments = await (window as any).Square.payments(
            paymentConfig.publicKey,
            paymentConfig.environment === 'sandbox' ? 'sandbox' : 'production'
          );
          resolve(payments);
        } else {
          reject(new Error('Square SDK failed to load'));
        }
      });
      script.addEventListener('error', () => reject(new Error('Failed to load Square SDK')));
      document.head.appendChild(script);
    });
  }

  // Map Stripe status to our status
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'processing',
      'canceled': 'cancelled',
      'succeeded': 'succeeded',
    };
    return statusMap[stripeStatus] || 'failed';
  }
}

// Singleton instance
let paymentServiceInstance: PaymentService;

export function getPaymentService(provider?: string): PaymentService {
  if (!paymentServiceInstance || (provider && provider !== paymentServiceInstance['provider'])) {
    paymentServiceInstance = new PaymentService(provider);
  }
  return paymentServiceInstance;
}