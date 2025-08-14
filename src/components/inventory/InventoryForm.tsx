import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/Button';
import type { InventoryItem } from '@/types';
import { TextField, SelectField, NumberField, DateField, LexicalEditorField, EmailField, CheckboxField } from '@/components/form-fields';
// TODO: Use Timestamp for date fields when needed
// import { Timestamp } from 'firebase/firestore';

const schema = yup.object({
  itemCode: yup.string().required('Item code is required'),
  name: yup.string().required('Item name is required'),
  description: yup.string().optional(),
  category: yup.string().required('Category is required'),
  manufacturer: yup.string().optional(),
  catalogNumber: yup.string().optional(),
  unit: yup.string().required('Unit is required'),
  currentStock: yup.number().min(0, 'Current stock must be positive').optional(),
  minimumStock: yup.number().min(0, 'Minimum stock must be positive').required('Minimum stock is required'),
  reorderPoint: yup.number().min(0, 'Reorder point must be positive').required('Reorder point is required'),
  reorderLevel: yup.number().min(0, 'Reorder level must be positive').optional(),
  reorderQuantity: yup.number().min(0, 'Reorder quantity must be positive').required('Reorder quantity is required'),
  unitCost: yup.number().min(0, 'Unit cost must be positive').optional(),
  vendorName: yup.string().optional(),
  vendorCatalogNumber: yup.string().optional(),
  vendorItemCode: yup.string().optional(),
  vendorContactEmail: yup.string().email('Must be a valid email').optional(),
  vendorLeadTime: yup.string().optional(),
  location: yup.string().optional(),
  quantity: yup.number().optional(),
  lotNumber: yup.string().optional(),
  expiryDate: yup.date().optional(),
  storageConditions: yup.string().optional(),
  notes: yup.string().optional(),
  requiresLotTracking: yup.boolean().required('Lot tracking preference is required'),
  requiresExpirationTracking: yup.boolean().required('Expiration tracking preference is required'),
  hazardous: yup.boolean().optional(),
  msdsUrl: yup.string().url('Must be a valid URL').optional(),
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
    resolver: yupResolver(schema) as any,
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

  // const currentStock = watch('currentStock');
  // const minimumStock = watch('minimumStock');

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
            <Controller
              name="itemCode"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Item Code"
                  name="itemCode"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., REA-001"
                  error={errors.itemCode?.message}
                  required
                  showLabel
                />
              )}
            />

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Item Name"
                  name="name"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., Glucose Reagent"
                  error={errors.name?.message}
                  required
                  showLabel
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Category"
                  name="category"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'reagents', label: 'Reagents' },
                    { value: 'consumables', label: 'Consumables' },
                    { value: 'equipment', label: 'Equipment' },
                    { value: 'calibrators', label: 'Calibrators' },
                    { value: 'controls', label: 'Controls' },
                    { value: 'supplies', label: 'Supplies' },
                  ]}
                  error={errors.category?.message}
                  required
                  showLabel
                />
              )}
            />

            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Unit"
                  name="unit"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., mL, units, boxes"
                  error={errors.unit?.message}
                  required
                  showLabel
                />
              )}
            />

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Location"
                  name="location"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., Refrigerator A, Shelf 3"
                  showLabel
                />
              )}
            />
          </div>
        </div>

        {/* Stock Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Stock Information</h3>
          
          <div className="space-y-4">
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <NumberField
                  label="Current Quantity"
                  name="quantity"
                  value={field.value}
                  onChange={field.onChange}
                  min={0}
                  error={errors.quantity?.message}
                  required
                  showLabel
                />
              )}
            />

            <div>
              <Controller
                name="reorderLevel"
                control={control}
                render={({ field }) => (
                  <NumberField
                    label="Reorder Level"
                    name="reorderLevel"
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    error={errors.reorderLevel?.message}
                    required
                    showLabel
                  />
                )}
              />
              {watch('quantity') && watch('reorderLevel') && watch('quantity') <= watch('reorderLevel') && watch('quantity') > 0 && (
                <p className="text-yellow-600 text-xs mt-1">
                  Current quantity is at or below reorder level
                </p>
              )}
            </div>

            <Controller
              name="reorderQuantity"
              control={control}
              render={({ field }) => (
                <NumberField
                  label="Reorder Quantity"
                  name="reorderQuantity"
                  value={field.value}
                  onChange={field.onChange}
                  min={0}
                  error={errors.reorderQuantity?.message}
                  required
                  showLabel
                />
              )}
            />

            <Controller
              name="unitCost"
              control={control}
              render={({ field }) => (
                <NumberField
                  label="Unit Cost ($)"
                  name="unitCost"
                  value={field.value}
                  onChange={field.onChange}
                  min={0}
                  step={0.01}
                  error={errors.unitCost?.message}
                  required
                  showLabel
                />
              )}
            />

            <Controller
              name="lotNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Lot Number"
                  name="lotNumber"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., LOT-2024-001"
                  showLabel
                />
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field }) => (
                  <DateField
                    label=""
                    name="expiryDate"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select expiry date"
                    minDate={new Date()}
                    showLabel={false}
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
          <Controller
            name="vendorName"
            control={control}
            render={({ field }) => (
              <TextField
                label="Vendor Name"
                name="vendorName"
                value={field.value}
                onChange={field.onChange}
                placeholder="e.g., Lab Supplies Inc."
                showLabel
              />
            )}
          />

          <Controller
            name="vendorItemCode"
            control={control}
            render={({ field }) => (
              <TextField
                label="Vendor Item Code"
                name="vendorItemCode"
                value={field.value}
                onChange={field.onChange}
                placeholder="e.g., VEN-12345"
                showLabel
              />
            )}
          />
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Additional Information</h3>
        
        <div className="space-y-4">
          <Controller
            name="storageConditions"
            control={control}
            render={({ field }) => (
              <TextField
                label="Storage Conditions"
                name="storageConditions"
                value={field.value}
                onChange={field.onChange}
                placeholder="e.g., Store at 2-8°C"
                showLabel
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <LexicalEditorField
                label="Notes"
                name="notes"
                value={field.value}
                onChange={field.onChange}
                placeholder="Additional notes or special instructions..."
                rows={3}
                showLabel
              />
            )}
          />
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