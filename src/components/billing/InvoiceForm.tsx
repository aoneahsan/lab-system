import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, Plus, Trash2, User } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useTests } from '@/hooks/useTests';
import type { InvoiceFormData, InvoiceItem } from '@/types/billing.types';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([]);
  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];
  const { data: tests = [] } = useTests();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<InvoiceFormData>({
    defaultValues: {
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: [],
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        testCode: '',
        testName: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };

    if (field === 'testCode') {
      const test = tests.find((t) => t.code === value);
      if (test) {
        item.testCode = test.code;
        item.testName = test.name;
        item.unitPrice = test.price || test.cost || 0;
      }
    } else if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'tax') {
      item[field] = Number(value);
    } else if (field === 'testName') {
      item[field] = value as string;
    }

    // Recalculate totals
    const amount = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    const tax = item.tax || 0;
    item.amount = amount;
    item.total = amount - discount + tax;

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = Number(watch('discountAmount')) || 0;
    const total = subtotal - discountAmount;

    return { subtotal, total };
  };

  const onFormSubmit = (data: InvoiceFormData) => {
    onSubmit({
      ...data,
      items,
    });
  };

  const { subtotal, total } = calculateTotals();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Patient Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient *</label>
            <select
              {...register('patientId', { required: 'Patient is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName} - {patient.patientId}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date *</label>
            <input
              type="date"
              {...register('dueDate', { required: 'Due date is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Invoice Items
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No items added. Click "Add Item" to start.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Test</label>
                    <select
                      value={item.testCode}
                      onChange={(e) => updateItem(index, 'testCode', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select test...</option>
                      {tests.map((test) => (
                        <option key={test.id} value={test.code}>
                          {test.code} - {test.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total</label>
                    <input
                      type="text"
                      value={`$${item.total.toFixed(2)}`}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-6 border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <label className="text-sm">Discount:</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('discountAmount')}
                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between text-lg font-medium pt-2 border-t">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white shadow rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Additional notes or payment instructions..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || items.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating Invoice...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
