/**
 * Stock Transaction Form Component
 * Form for recording stock transactions
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import type { 
  StockTransactionFormData, 
  TransactionType,
  InventoryItem 
} from '@/types/inventory.types';

interface StockTransactionFormProps {
  item: InventoryItem;
  onSubmit: (data: StockTransactionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const transactionTypes: { value: TransactionType; label: string; description: string }[] = [
  { 
    value: 'purchase', 
    label: 'Purchase/Receipt', 
    description: 'Receive new stock from vendor' 
  },
  { 
    value: 'usage', 
    label: 'Usage', 
    description: 'Use stock for testing or procedures' 
  },
  { 
    value: 'adjustment', 
    label: 'Adjustment', 
    description: 'Adjust stock count (inventory reconciliation)' 
  },
  { 
    value: 'disposal', 
    label: 'Disposal', 
    description: 'Dispose of expired or damaged stock' 
  },
  { 
    value: 'transfer', 
    label: 'Transfer', 
    description: 'Transfer stock to another location' 
  },
  { 
    value: 'return', 
    label: 'Return to Vendor', 
    description: 'Return stock to vendor' 
  }
];

export const StockTransactionForm: React.FC<StockTransactionFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    // setValue,
    formState: { errors }
  } = useForm<StockTransactionFormData>({
    defaultValues: {
      itemId: item.id,
      type: 'usage',
      quantity: 1
    }
  });

  const transactionType = watch('type');
  const quantity = watch('quantity');

  // Show different fields based on transaction type
  const showVendorFields = ['purchase', 'return'].includes(transactionType);
  const showLotFields = item.requiresLotTracking && transactionType === 'purchase';
  const showExpirationFields = item.requiresExpirationTracking && transactionType === 'purchase';
  const showReasonField = ['adjustment', 'disposal'].includes(transactionType);
  const isOutgoing = ['usage', 'disposal', 'transfer', 'return'].includes(transactionType);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Item Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Item Information</h4>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Name:</span> {item.name}</p>
          <p><span className="font-medium">Current Stock:</span> {item.currentStock} {item.unit}</p>
          {item.catalogNumber && (
            <p><span className="font-medium">Catalog #:</span> {item.catalogNumber}</p>
          )}
        </div>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type *
        </label>
        <div className="space-y-2">
          {transactionTypes.map(({ value, label, description }) => (
            <label key={value} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value={value}
                {...register('type', { required: 'Transaction type is required' })}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity *
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            {...register('quantity', { 
              required: 'Quantity is required',
              valueAsNumber: true,
              min: { value: 1, message: 'Quantity must be at least 1' },
              validate: (value) => {
                if (isOutgoing && value > item.currentStock) {
                  return `Insufficient stock. Available: ${item.currentStock} ${item.unit}`;
                }
                return true;
              }
            })}
            className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-600">{item.unit}</span>
        </div>
        {errors.quantity && (
          <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
        )}
        {isOutgoing && (
          <p className="text-sm text-gray-500 mt-1">
            Available stock: {item.currentStock} {item.unit}
          </p>
        )}
      </div>

      {/* Lot Number (for lot-tracked items) */}
      {showLotFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lot Number *
          </label>
          <input
            type="text"
            {...register('lotNumber', { 
              required: showLotFields ? 'Lot number is required for this item' : false 
            })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter lot number"
          />
          {errors.lotNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.lotNumber.message}</p>
          )}
        </div>
      )}

      {/* Expiration Date (for expiration-tracked items) */}
      {showExpirationFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date *
          </label>
          <input
            type="date"
            {...register('expirationDate', { 
              required: showExpirationFields ? 'Expiration date is required for this item' : false,
              valueAsDate: true
            })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {errors.expirationDate && (
            <p className="text-red-500 text-sm mt-1">{errors.expirationDate.message}</p>
          )}
        </div>
      )}

      {/* Vendor Information (for purchases and returns) */}
      {showVendorFields && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Vendor Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name
            </label>
            <input
              type="text"
              {...register('vendor.name')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">$</span>
              <input
                type="number"
                step="0.01"
                {...register('unitCost', { valueAsNumber: true })}
                className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <span className="text-gray-600">per {item.unit}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reason (for adjustments and disposals) */}
      {showReasonField && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <select
            {...register('reason', { 
              required: showReasonField ? 'Reason is required' : false 
            })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select reason</option>
            {transactionType === 'adjustment' && (
              <>
                <option value="inventory_count">Physical inventory count</option>
                <option value="damaged">Damaged items found</option>
                <option value="data_correction">Data correction</option>
                <option value="other">Other</option>
              </>
            )}
            {transactionType === 'disposal' && (
              <>
                <option value="expired">Expired</option>
                <option value="damaged">Damaged</option>
                <option value="contaminated">Contaminated</option>
                <option value="recalled">Recalled</option>
                <option value="other">Other</option>
              </>
            )}
          </select>
          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Add any additional notes..."
        />
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Transaction Summary</h4>
        <div className="text-sm text-blue-700">
          <p>
            <span className="font-medium">Action:</span>{' '}
            {isOutgoing ? 'Remove' : 'Add'} {quantity || 0} {item.unit} 
            {isOutgoing ? ' from' : ' to'} inventory
          </p>
          <p>
            <span className="font-medium">New Stock Level:</span>{' '}
            {isOutgoing 
              ? item.currentStock - (quantity || 0)
              : item.currentStock + (quantity || 0)
            } {item.unit}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Recording...' : 'Record Transaction'}
        </button>
      </div>
    </form>
  );
};