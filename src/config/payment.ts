// Payment Gateway Configuration
// Supports multiple payment providers: Stripe, PayPal, Square

export interface PaymentConfig {
  provider: 'stripe' | 'paypal' | 'square';
  publicKey: string;
  environment: 'sandbox' | 'production';
  currency: string;
  country: string;
  supportedMethods: PaymentMethod[];
  webhookEndpoint?: string;
}

export interface PaymentMethod {
  type: 'card' | 'bank' | 'wallet' | 'insurance';
  enabled: boolean;
  label: string;
  icon?: string;
}

// Get payment configuration from environment
export const paymentConfig: PaymentConfig = {
  provider: (import.meta.env.VITE_PAYMENT_PROVIDER || 'stripe') as PaymentConfig['provider'],
  publicKey: import.meta.env.VITE_PAYMENT_PUBLIC_KEY || '',
  environment: (import.meta.env.VITE_PAYMENT_ENV || 'sandbox') as PaymentConfig['environment'],
  currency: import.meta.env.VITE_PAYMENT_CURRENCY || 'USD',
  country: import.meta.env.VITE_PAYMENT_COUNTRY || 'US',
  webhookEndpoint: import.meta.env.VITE_PAYMENT_WEBHOOK_ENDPOINT,
  supportedMethods: [
    {
      type: 'card',
      enabled: true,
      label: 'Credit/Debit Card',
      icon: 'credit-card',
    },
    {
      type: 'bank',
      enabled: true,
      label: 'Bank Transfer (ACH)',
      icon: 'building-library',
    },
    {
      type: 'wallet',
      enabled: true,
      label: 'Digital Wallet',
      icon: 'device-phone-mobile',
    },
    {
      type: 'insurance',
      enabled: true,
      label: 'Insurance Billing',
      icon: 'shield-check',
    },
  ],
};

// Payment provider URLs
export const paymentUrls = {
  stripe: {
    sandbox: 'https://js.stripe.com/v3/',
    production: 'https://js.stripe.com/v3/',
  },
  paypal: {
    sandbox: 'https://www.paypal.com/sdk/js',
    production: 'https://www.paypal.com/sdk/js',
  },
  square: {
    sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
    production: 'https://web.squarecdn.com/v1/square.js',
  },
};

// Fee structure configuration
export interface FeeStructure {
  percentage: number; // Percentage fee (e.g., 2.9)
  fixed: number; // Fixed fee in cents (e.g., 30)
  insuranceFee?: number; // Additional fee for insurance claims
}

export const feeStructures: Record<string, FeeStructure> = {
  stripe: {
    percentage: 2.9,
    fixed: 30,
    insuranceFee: 1.5,
  },
  paypal: {
    percentage: 2.99,
    fixed: 49,
    insuranceFee: 1.5,
  },
  square: {
    percentage: 2.6,
    fixed: 10,
    insuranceFee: 1.5,
  },
};

// Calculate processing fee
export function calculateProcessingFee(
  amount: number,
  provider: string = paymentConfig.provider
): number {
  const fee = feeStructures[provider];
  if (!fee) return 0;
  
  const percentageFee = (amount * fee.percentage) / 100;
  const totalFee = percentageFee + fee.fixed / 100;
  
  return Math.round(totalFee * 100) / 100; // Round to 2 decimal places
}

// Insurance payer configurations
export interface InsurancePayer {
  id: string;
  name: string;
  type: 'medicare' | 'medicaid' | 'commercial';
  requiresAuth: boolean;
  claimEndpoint?: string;
  supportedCodes: string[];
}

export const insurancePayers: InsurancePayer[] = [
  {
    id: 'medicare',
    name: 'Medicare',
    type: 'medicare',
    requiresAuth: true,
    claimEndpoint: '/api/claims/medicare',
    supportedCodes: ['A', 'B'],
  },
  {
    id: 'medicaid',
    name: 'Medicaid',
    type: 'medicaid',
    requiresAuth: true,
    claimEndpoint: '/api/claims/medicaid',
    supportedCodes: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'bcbs',
    name: 'Blue Cross Blue Shield',
    type: 'commercial',
    requiresAuth: true,
    claimEndpoint: '/api/claims/bcbs',
    supportedCodes: ['PPO', 'HMO', 'EPO'],
  },
  {
    id: 'unitedhealthcare',
    name: 'UnitedHealthcare',
    type: 'commercial',
    requiresAuth: true,
    claimEndpoint: '/api/claims/uhc',
    supportedCodes: ['PPO', 'HMO', 'POS'],
  },
  {
    id: 'aetna',
    name: 'Aetna',
    type: 'commercial',
    requiresAuth: true,
    claimEndpoint: '/api/claims/aetna',
    supportedCodes: ['PPO', 'HMO', 'EPO', 'POS'],
  },
];

// Payment status types
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

// Insurance claim status types
export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'in_review'
  | 'approved'
  | 'denied'
  | 'partially_approved'
  | 'paid'
  | 'appealed';