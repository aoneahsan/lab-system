import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import type { Vendor, InventoryItem } from '@/types/inventory.types';
import { toast } from 'react-hot-toast';

const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  requestedBy: z.string().min(1, 'Requested by is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
  })).min(1, 'At least one item is required')
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePurchaseOrderModal({ isOpen, onClose }: Props) {
  const { 
    vendors, 
    inventory, 
    createPurchaseOrder, 
    fetchVendors, 
    fetchInventory 
  } = useInventoryStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      items: [{ itemId: '', quantity: 1, unitPrice: 0 }]
    }
  });

  const [items, setItems] = useState([{ itemId: '', quantity: 1, unitPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchInventory();
    }
  }, [isOpen, fetchVendors, fetchInventory]);

  const addItem = () => {
    const newItems = [...items, { itemId: '', quantity: 1, unitPrice: 0 }];
    setItems(newItems);
    setValue('items', newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setValue('items', newItems);
    }
  };

  const updateItem = (index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setValue('items', newItems);
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      setIsSubmitting(true);
      
      // Calculate total
      const total = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      // Find vendor
      const vendor = vendors.find(v => v.id === data.vendorId);
      if (!vendor) {
        toast.error('Selected vendor not found');
        return;
      }

      // Create purchase order
      await createPurchaseOrder({
        vendor: {
          id: vendor.id,
          name: vendor.name,
          contactEmail: vendor.contactEmail,
          contactPhone: vendor.contactPhone
        },
        items: data.items.map(item => {
          const inventoryItem = inventory.find(inv => inv.id === item.itemId);
          return {
            itemId: item.itemId,
            name: inventoryItem?.name || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          };
        }),
        total,
        requestedBy: data.requestedBy,
        notes: data.notes || '',
        status: 'draft'
      });

      toast.success('Purchase order created successfully');
      reset();
      setItems([{ itemId: '', quantity: 1, unitPrice: 0 }]);
      onClose();
    } catch (error) {
      toast.error('Failed to create purchase order');
      console.error('Error creating purchase order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setItems([{ itemId: '', quantity: 1, unitPrice: 0 }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Purchase Order</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                {...register('vendorId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor: Vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {errors.vendorId && (
                <p className="text-red-500 text-xs mt-1">{errors.vendorId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested By
              </label>
              <input
                type="text"
                {...register('requestedBy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter requestor name"
              />
              {errors.requestedBy && (
                <p className="text-red-500 text-xs mt-1">{errors.requestedBy.message}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Item</option>
                      {inventory.map((invItem: InventoryItem) => (
                        <option key={invItem.id} value={invItem.id}>
                          {invItem.name} - {invItem.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Qty"
                      min="1"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Unit Price"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={`$${(item.quantity * item.unitPrice).toFixed(2)}`}
                      readOnly
                      className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errors.items && (
              <p className="text-red-500 text-xs mt-1">{errors.items.message}</p>
            )}
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="text-lg font-semibold">
              Total: ${items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}