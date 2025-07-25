import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { billingService, Payment } from '../../services/billing';
import { formatCurrency } from '../../utils/formatters';
import {
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PaymentProcessingProps {
  billId?: string;
  defaultAmount?: number;
  onSuccess?: (payment: any) => void;
}

const PaymentProcessing: React.FC<PaymentProcessingProps> = ({
  billId,
  defaultAmount = 0,
  onSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('card');
  const [amount, setAmount] = useState(defaultAmount);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [reference, setReference] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: bill } = useQuery({
    queryKey: ['bill', billId],
    queryFn: () => billingService.getBillById(billId!),
    enabled: !!billId
  });

  const processMutation = useMutation({
    mutationFn: (data: any) => billingService.processPayment(data),
    onSuccess: (data) => {
      setShowConfirmation(true);
      if (onSuccess) {
        onSuccess(data);
      }
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    }
  });

  const handleCardInputChange = (field: keyof typeof cardDetails, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      // Format card number with spaces
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (field === 'expiry') {
      // Format expiry as MM/YY
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2');
    } else if (field === 'cvv') {
      // Limit CVV to 4 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardDetails({ ...cardDetails, [field]: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentData: any = {
      billId,
      amount,
      method: paymentMethod,
      reference
    };

    if (paymentMethod === 'card') {
      paymentData.cardDetails = {
        ...cardDetails,
        number: cardDetails.number.replace(/\s/g, '')
      };
    }

    processMutation.mutate(paymentData);
  };

  const resetForm = () => {
    setAmount(defaultAmount);
    setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
    setReference('');
    setShowConfirmation(false);
  };

  const validateForm = () => {
    if (amount <= 0) return false;
    
    if (paymentMethod === 'card') {
      const cardNumber = cardDetails.number.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) return false;
      if (!cardDetails.expiry.match(/^\d{2}\/\d{2}$/)) return false;
      if (cardDetails.cvv.length < 3) return false;
      if (!cardDetails.name.trim()) return false;
    } else if (paymentMethod === 'check') {
      if (!reference.trim()) return false;
    }
    
    return true;
  };

  if (showConfirmation) {
    return (
      <div className="text-center py-12">
        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Payment Successful!</h3>
        <p className="mt-2 text-sm text-gray-500">
          Payment of {formatCurrency(amount)} has been processed successfully.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Transaction ID: {processMutation.data?.transactionId}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {bill && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">Bill Summary</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                Bill Number: <span className="font-medium">{bill.billNumber}</span>
              </p>
              <p className="text-sm text-gray-600">
                Total Amount: <span className="font-medium">{formatCurrency(bill.totals.total)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Balance Due: <span className="font-medium text-red-600">{formatCurrency(bill.totals.balance)}</span>
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center p-3 border rounded-lg ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CreditCardIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center p-3 border rounded-lg ${
                paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <BanknotesIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('check')}
              className={`flex flex-col items-center p-3 border rounded-lg ${
                paymentMethod === 'check'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <DocumentTextIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">Check</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`flex flex-col items-center p-3 border rounded-lg ${
                paymentMethod === 'online'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <DevicePhoneMobileIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">Online</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Payment Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0.01"
              max={bill?.totals.balance}
              className="pl-7 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>
          {bill && amount > bill.totals.balance && (
            <p className="mt-1 text-sm text-yellow-600">
              Amount exceeds balance due. Excess will be credited.
            </p>
          )}
        </div>

        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={cardDetails.number}
                onChange={(e) => handleCardInputChange('number', e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiry"
                  value={cardDetails.expiry}
                  onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                  placeholder="MM/YY"
                  maxLength="5"
                  className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  value={cardDetails.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                  placeholder="123"
                  maxLength="4"
                  className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                Cardholder Name
              </label>
              <input
                type="text"
                id="cardName"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                placeholder="John Doe"
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        )}

        {(paymentMethod === 'check' || paymentMethod === 'online') && (
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
              {paymentMethod === 'check' ? 'Check Number' : 'Reference Number'}
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={paymentMethod === 'check' ? 'Check #1234' : 'Reference #'}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}

        {processMutation.isError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Payment Failed</h3>
                <p className="mt-1 text-sm text-red-700">
                  {processMutation.error?.message || 'An error occurred while processing the payment.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processMutation.isPending || !validateForm()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {processMutation.isPending ? 'Processing...' : `Process Payment`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentProcessing;