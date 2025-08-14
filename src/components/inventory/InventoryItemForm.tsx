/**
 * Inventory Item Form Component
 * Form for creating and editing inventory items
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, SelectField, NumberField, LexicalEditorField, CheckboxField } from '@/components/form-fields';
import type {
  InventoryItemFormData,
  UnitOfMeasure,
  InventoryCategory,
} from '@/types/inventory.types';

interface InventoryItemFormProps {
  initialData?: Partial<InventoryItemFormData>;
  onSubmit: (data: InventoryItemFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const units: UnitOfMeasure[] = [
  'piece',
  'box',
  'case',
  'ml',
  'l',
  'mg',
  'g',
  'kg',
  'test',
  'vial',
  'bottle',
  'pack',
  'roll',
  'sheet',
];

const categories: InventoryCategory[] = [
  'reagent',
  'control',
  'calibrator',
  'consumable',
  'equipment',
  'ppe',
  'office_supply',
  'maintenance',
  'other',
];

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    // watch,
    formState: { errors },
  } = useForm<InventoryItemFormData>({
    defaultValues: {
      requiresLotTracking: false,
      requiresExpirationTracking: false,
      hazardous: false,
      ...initialData,
    },
  });

  // const requiresRefrigeration = watch('storageCondition.requiresRefrigeration');
  // const requiresFreezing = watch('storageCondition.requiresFreezing');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Item name is required' }}
            render={({ field }) => (
              <TextField
                label="Item Name *"
                placeholder="Enter item name"
                error={errors.name?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            rules={{ required: 'Category is required' }}
            render={({ field }) => (
              <SelectField
                label="Category *"
                placeholder="Select category"
                options={categories.map((cat) => ({
                  value: cat,
                  label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')
                }))}
                error={errors.category?.message}
                {...field}
                onValueChange={field.onChange}
              />
            )}
          />

          <Controller
            name="manufacturer"
            control={control}
            render={({ field }) => (
              <TextField
                label="Manufacturer"
                placeholder="Enter manufacturer name"
                {...field}
              />
            )}
          />

          <Controller
            name="catalogNumber"
            control={control}
            render={({ field }) => (
              <TextField
                label="Catalog Number"
                placeholder="Enter catalog number"
                {...field}
              />
            )}
          />

          <Controller
            name="unit"
            control={control}
            rules={{ required: 'Unit is required' }}
            render={({ field }) => (
              <SelectField
                label="Unit of Measure *"
                placeholder="Select unit"
                options={units.map((unit) => ({
                  value: unit,
                  label: unit
                }))}
                error={errors.unit?.message}
                {...field}
                onValueChange={field.onChange}
              />
            )}
          />

          <Controller
            name="unitCost"
            control={control}
            render={({ field }) => (
              <NumberField
                label="Unit Cost"
                placeholder="0.00"
                step={0.01}
                {...field}
              />
            )}
          />
        </div>

        <div className="mt-4">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <LexicalEditorField
                label="Description"
                placeholder="Enter item description"
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Stock Levels */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="minimumStock"
            control={control}
            rules={{
              required: 'Minimum stock is required',
              min: { value: 0, message: 'Must be 0 or greater' },
            }}
            render={({ field }) => (
              <NumberField
                label="Minimum Stock *"
                placeholder="0"
                error={errors.minimumStock?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="maximumStock"
            control={control}
            render={({ field }) => (
              <NumberField
                label="Maximum Stock"
                placeholder="0"
                {...field}
              />
            )}
          />

          <Controller
            name="reorderPoint"
            control={control}
            rules={{
              required: 'Reorder point is required',
              min: { value: 0, message: 'Must be 0 or greater' },
            }}
            render={({ field }) => (
              <NumberField
                label="Reorder Point *"
                placeholder="0"
                error={errors.reorderPoint?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="reorderQuantity"
            control={control}
            rules={{
              required: 'Reorder quantity is required',
              min: { value: 1, message: 'Must be 1 or greater' },
            }}
            render={({ field }) => (
              <NumberField
                label="Reorder Quantity *"
                placeholder="0"
                error={errors.reorderQuantity?.message}
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Storage Conditions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Storage Conditions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature Range (°C)
            </label>
            <div className="flex space-x-2">
              <Controller
                name="storageCondition.temperatureMin"
                control={control}
                render={({ field }) => (
                  <NumberField
                    placeholder="Min"
                    className="w-1/2"
                    {...field}
                  />
                )}
              />
              <Controller
                name="storageCondition.temperatureMax"
                control={control}
                render={({ field }) => (
                  <NumberField
                    placeholder="Max"
                    className="w-1/2"
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          <Controller
            name="storageCondition.humidity"
            control={control}
            render={({ field }) => (
              <TextField
                label="Humidity Requirements"
                placeholder="e.g., 30-60%"
                {...field}
              />
            )}
          />
        </div>

        <div className="mt-4 space-y-2">
          <Controller
            name="storageCondition.lightSensitive"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Light sensitive"
                {...field}
              />
            )}
          />

          <Controller
            name="storageCondition.requiresRefrigeration"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Requires refrigeration (2-8°C)"
                {...field}
              />
            )}
          />

          <Controller
            name="storageCondition.requiresFreezing"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Requires freezing (-20°C or below)"
                {...field}
              />
            )}
          />
        </div>

        <div className="mt-4">
          <Controller
            name="storageCondition.specialInstructions"
            control={control}
            render={({ field }) => (
              <LexicalEditorField
                label="Special Storage Instructions"
                placeholder="Enter any special storage instructions"
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Compliance & Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance & Tracking</h3>

        <div className="space-y-2">
          <Controller
            name="requiresLotTracking"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Requires lot tracking"
                {...field}
              />
            )}
          />

          <Controller
            name="requiresExpirationTracking"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Requires expiration date tracking"
                {...field}
              />
            )}
          />

          <Controller
            name="hazardous"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Hazardous material"
                {...field}
              />
            )}
          />
        </div>

        <div className="mt-4">
          <Controller
            name="msdsUrl"
            control={control}
            render={({ field }) => (
              <TextField
                label="MSDS URL"
                placeholder="https://example.com/msds/..."
                type="url"
                {...field}
              />
            )}
          />
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
          {isLoading ? 'Saving...' : 'Save Item'}
        </button>
      </div>
    </form>
  );
};
