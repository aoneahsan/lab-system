import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/Button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { InventoryItem } from '@/types';
import { Timestamp } from 'firebase/firestore';

const schema = yup.object({
  itemCode: yup.string().required('Item code is required'),
  name: yup.string().required('Item name is required'),
  description: yup.string().required('Description is required'),
  category: yup.string().required('Category is required'),
  manufacturer: yup.string().required('Manufacturer is required'),
  catalogNumber: yup.string().required('Catalog number is required'),
  unit: yup.string().required('Unit is required'),
  currentStock: yup.number().min(0, 'Current stock must be positive').required('Current stock is required'),
  minimumStock: yup.number().min(0, 'Minimum stock must be positive').required('Minimum stock is required'),
  reorderPoint: yup.number().min(0, 'Reorder point must be positive').required('Reorder point is required'),
  reorderLevel: yup.number().min(0, 'Reorder level must be positive').required('Reorder level is required'),
  reorderQuantity: yup.number().min(0, 'Reorder quantity must be positive').required('Reorder quantity is required'),
  unitCost: yup.number().min(0, 'Unit cost must be positive').required('Unit cost is required'),
  vendorName: yup.string().required('Vendor name is required'),
  vendorCatalogNumber: yup.string().required('Vendor catalog number is required'),
  vendorItemCode: yup.string().optional(),
  vendorContactEmail: yup.string().email('Must be a valid email').optional(),
  vendorLeadTime: yup.string().optional(),
  location: yup.string().required('Location is required'),
  quantity: yup.number().optional(),
  lotNumber: yup.string().optional(),
  expiryDate: yup.date().optional(),
  storageConditions: yup.string().optional(),
  notes: yup.string().optional(),
  requiresLotTracking: yup.boolean().required('Lot tracking preference is required'),
  requiresExpirationTracking: yup.boolean().required('Expiration tracking preference is required'),
  hazardous: yup.boolean().required('Hazardous status is required'),
  msdsUrl: yup.string().url('Must be a valid URL').required('MSDS URL is required'),
});

type FormData = yup.InferType<typeof schema>;

interface InventoryFormProps {
  initialData?: InventoryItem;
  onSubmit: (data: Partial<InventoryItem>) => void;
  onCancel: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      itemCode: initialData?.itemCode || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'reagent',
      manufacturer: initialData?.manufacturer || '',
      catalogNumber: initialData?.catalogNumber || '',
      unit: initialData?.unit || 'piece',
      currentStock: initialData?.currentStock || 0,
      minimumStock: initialData?.minimumStock || 0,
      reorderPoint: initialData?.reorderPoint || 0,
      reorderLevel: initialData?.reorderPoint || 0, // Using reorderPoint as default
      reorderQuantity: initialData?.reorderQuantity || 0,
      unitCost: initialData?.unitCost || 0,
      vendorName: initialData?.preferredVendor?.name || '',
      vendorCatalogNumber: initialData?.preferredVendor?.catalogNumber || '',
      vendorItemCode: '',
      vendorContactEmail: '',
      vendorLeadTime: '',
      location: initialData?.location || '',
      quantity: initialData?.currentStock || 0,
      lotNumber: '',
      expiryDate: undefined,
      storageConditions: '',
      notes: initialData?.notes || '',
      requiresLotTracking: initialData?.requiresLotTracking || false,
      requiresExpirationTracking: initialData?.requiresExpirationTracking || false,
      hazardous: initialData?.hazardous || false,
      msdsUrl: initialData?.msdsUrl || '',
    },
  });

  const currentStock = watch('currentStock');
  const minimumStock = watch('minimumStock');

  const handleFormSubmit = (data: FormData) => {
    const itemData: Partial<InventoryItem> = {
      name: data.name,
      description: data.description,
      category: data.category as any,
      manufacturer: data.manufacturer,
      catalogNumber: data.catalogNumber,
      unit: data.unit as any,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
      reorderPoint: data.reorderPoint,
      reorderQuantity: data.reorderQuantity,
      unitCost: data.unitCost,
      preferredVendor: data.vendorName ? {
        id: '',
        name: data.vendorName,
        catalogNumber: data.vendorCatalogNumber,
      } : undefined,
      requiresLotTracking: data.requiresLotTracking,
      requiresExpirationTracking: data.requiresExpirationTracking,
      hazardous: data.hazardous,
      msdsUrl: data.msdsUrl,
    };

    onSubmit(itemData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                {...register('itemCode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., REA-001"
              />
              {errors.itemCode && (
                <p className="text-red-500 text-xs mt-1">{errors.itemCode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Glucose Reagent"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="reagents">Reagents</option>
                <option value="consumables">Consumables</option>
                <option value="equipment">Equipment</option>
                <option value="calibrators">Calibrators</option>
                <option value="controls">Controls</option>
                <option value="supplies">Supplies</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <input
                {...register('unit')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., mL, units, boxes"
              />
              {errors.unit && (
                <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                {...register('location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Refrigerator A, Shelf 3"
              />
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Stock Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Quantity *
              </label>
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Level *
              </label>
              <input
                type="number"
                {...register('reorderLevel', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {errors.reorderLevel && (
                <p className="text-red-500 text-xs mt-1">{errors.reorderLevel.message}</p>
              )}
              {watch('quantity') && watch('reorderLevel') && watch('quantity') <= watch('reorderLevel') && watch('quantity') > 0 && (
                <p className="text-yellow-600 text-xs mt-1">
                  Current quantity is at or below reorder level
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Quantity *
              </label>
              <input
                type="number"
                {...register('reorderQuantity', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {errors.reorderQuantity && (
                <p className="text-red-500 text-xs mt-1">{errors.reorderQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost ($) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('unitCost', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {errors.unitCost && (
                <p className="text-red-500 text-xs mt-1">{errors.unitCost.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number
              </label>
              <input
                {...register('lotNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., LOT-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Select expiry date"
                    minDate={new Date()}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Vendor Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name
            </label>
            <input
              {...register('vendorName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Lab Supplies Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Item Code
            </label>
            <input
              {...register('vendorItemCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., VEN-12345"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Additional Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Conditions
            </label>
            <input
              {...register('storageConditions')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Store at 2-8°C"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or special instructions..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
        >
          {initialData ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
};