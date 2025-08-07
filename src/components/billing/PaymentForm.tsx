import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';
import { getPaymentService } from '@/services/payment/paymentService';
import { BillingInfo } from '@/types/billing';
import { calculateProcessingFee } from '@/config/payment';

interface PaymentFormProps {
  amount: number;
  description: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  description,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const processingFee = calculateProcessingFee(amount);
  const totalAmount = amount + processingFee;

  const { register, handleSubmit, formState: { errors } } = useForm<BillingInfo>();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const paymentService = getPaymentService();
        const payment = await paymentService.createPayment(amount, description);
        setClientSecret(payment.metadata?.clientSecret || '');
      } catch (error) {
        onError('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [amount, description]);

  const onSubmit = async (data: BillingInfo) => {
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const paymentService = getPaymentService();
      const result = await paymentService.processPayment(
        clientSecret,
        { type: 'card', elements },
        { ...data, clientSecret }
      );

      if (result.success) {
        onSuccess(result.payment!.id);
      } else {
        onError(result.error || 'Payment failed');
      }
    } catch (error) {
      onError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span>Amount:</span>
          <span>${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Processing Fee:</span>
          <span>${processingFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Card Details</label>
          <div className="mt-1 p-3 border border-gray-300 rounded-md">
            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
};