import React from 'react';
import { X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useRecordPayment } from '@/hooks/useBilling';
import type { Invoice } from '@/types/billing.types';
import { 
  DateField, 
  NumberField, 
  SelectField, 
  TextField, 
  LexicalEditorField 
} from '@/components/form-fields';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

interface PaymentFormData {
  paymentDate: string;
  amount: number;
  method: 'cash' | 'credit_card' | 'debit_card' | 'check' | 'insurance' | 'eft' | 'other';
  referenceNumber: string;
  notes: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, invoice }) => {
  const recordPaymentMutation = useRecordPayment();
  
  const { control, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      amount: invoice.balanceDue,
      method: 'cash',
      referenceNumber: '',
      notes: '',
    }
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'check', label: 'Check' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'eft', label: 'EFT/Wire Transfer' },
    { value: 'other', label: 'Other' },
  ];

  const onSubmit = async (data: PaymentFormData) => {
    if (data.amount <= 0) {
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        paymentDate: new Date(data.paymentDate),
        amount: data.amount,
        method: data.method,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      });
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Record Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Invoice Info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-sm">
                <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                <p className="text-gray-600 dark:text-gray-400">Balance Due: ${invoice.balanceDue.toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Date */}
            <Controller
              name="paymentDate"
              control={control}
              rules={{ required: 'Payment date is required' }}
              render={({ field }) => (
                <DateField
                  {...field}
                  label="Payment Date"
                  required
                  error={errors.paymentDate?.message}
                />
              )}
            />

            {/* Amount */}
            <Controller
              name="amount"
              control={control}
              rules={{ 
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
                max: { value: invoice.balanceDue, message: `Amount cannot exceed balance due of $${invoice.balanceDue}` }
              }}
              render={({ field }) => (
                <NumberField
                  {...field}
                  label="Amount"
                  required
                  min={0.01}
                  max={invoice.balanceDue}
                  step={0.01}
                  placeholder="0.00"
                  error={errors.amount?.message}
                />
              )}
            />

            {/* Payment Method */}
            <Controller
              name="method"
              control={control}
              rules={{ required: 'Payment method is required' }}
              render={({ field }) => (
                <SelectField
                  {...field}
                  label="Payment Method"
                  options={paymentMethods}
                  required
                  error={errors.method?.message}
                />
              )}
            />

            {/* Reference Number */}
            <Controller
              name="referenceNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reference Number"
                  placeholder="Check number, transaction ID, etc."
                  error={errors.referenceNumber?.message}
                />
              )}
            />

            {/* Notes */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <LexicalEditorField
                  {...field}
                  label="Notes"
                  placeholder="Additional payment information..."
                  minHeight="100px"
                  showToolbar={false}
                  error={errors.notes?.message}
                />
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={recordPaymentMutation.isPending}
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;