import { loadStripe, Stripe, StripeElements, PaymentIntent } from '@stripe/stripe-js';
import { paymentConfig } from '@/config/payment';
import { BillingInfo } from '@/types/billing';

let stripePromise: Promise<Stripe | null>;

// Initialize Stripe
export function initializeStripe(): Promise<Stripe | null> {
  if (!stripePromise && paymentConfig.provider === 'stripe') {
    stripePromise = loadStripe(paymentConfig.publicKey);
  }
  return stripePromise;
}

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = paymentConfig.currency,
  metadata?: Record<string, string>
): Promise<PaymentIntent> {
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}

// Process card payment
export async function processCardPayment(
  stripe: Stripe,
  elements: StripeElements,
  billingInfo: BillingInfo
): Promise<{ paymentIntent?: PaymentIntent; error?: any }> {
  const cardElement = elements.getElement('card');
  
  if (!cardElement) {
    return { error: { message: 'Card element not found' } };
  }

  // Create payment method
  const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
    billing_details: {
      name: billingInfo.name,
      email: billingInfo.email,
      phone: billingInfo.phone,
      address: {
        line1: billingInfo.address.line1,
        line2: billingInfo.address.line2,
        city: billingInfo.address.city,
        state: billingInfo.address.state,
        postal_code: billingInfo.address.postalCode,
        country: billingInfo.address.country,
      },
    },
  });

  if (methodError || !paymentMethod) {
    return { error: methodError };
  }

  // Confirm payment
  const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
    billingInfo.clientSecret!,
    {
      payment_method: paymentMethod.id,
    }
  );

  if (confirmError) {
    return { error: confirmError };
  }

  return { paymentIntent };
}

// Setup ACH payment
export async function setupACHPayment(
  stripe: Stripe,
  accountNumber: string,
  routingNumber: string,
  accountHolderName: string,
  _accountHolderType: 'individual' | 'company'
): Promise<{ setupIntent?: any; error?: any }> {
  const { error, setupIntent } = await stripe.confirmAcssDebitSetup({
    payment_method: {
      billing_details: {
        name: accountHolderName,
      },
      acss_debit: {
        account_number: accountNumber,
        institution_number: routingNumber.substring(0, 3),
        transit_number: routingNumber.substring(3),
      },
    },
    payment_method_options: {
      acss_debit: {
        verification_method: 'instant',
      },
    },
  });

  if (error) {
    return { error };
  }

  return { setupIntent };
}

// Create subscription
export async function createSubscription(
  customerId: string,
  priceId: string,
  paymentMethodId: string
): Promise<any> {
  const response = await fetch('/api/payments/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      priceId,
      paymentMethodId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  return response.json();
}

// Process refund
export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<any> {
  const response = await fetch('/api/payments/refund', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to process refund');
  }

  return response.json();
}

// Get payment methods for customer
export async function getPaymentMethods(customerId: string): Promise<any[]> {
  const response = await fetch(`/api/payments/methods/${customerId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }

  return response.json();
}

// Delete payment method
export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  const response = await fetch(`/api/payments/methods/${paymentMethodId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete payment method');
  }
}

// Webhook signature verification
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<any> {
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}