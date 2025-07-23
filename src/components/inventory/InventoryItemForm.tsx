/**
 * Inventory Item Form Component
 * Form for creating and editing inventory items
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  InventoryItemFormData, 
  UnitOfMeasure, 
  InventoryCategory
} from '@/types/inventory.types';

interface InventoryItemFormProps {
  initialData?: Partial<InventoryItemFormData>;
  onSubmit: (data: InventoryItemFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const units: UnitOfMeasure[] = [
  'piece', 'box', 'case', 'ml', 'l', 'mg', 'g', 'kg', 
  'test', 'vial', 'bottle', 'pack', 'roll', 'sheet'
];

const categories: InventoryCategory[] = [
  'reagent', 'control', 'calibrator', 'consumable', 
  'equipment', 'ppe', 'office_supply', 'maintenance', 'other'
];

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    // watch,
    formState: { errors }
  } = useForm<InventoryItemFormData>({
    defaultValues: {
      requiresLotTracking: false,
      requiresExpirationTracking: false,
      hazardous: false,
      ...initialData
    }
  });

  // const requiresRefrigeration = watch('storageCondition.requiresRefrigeration');
  // const requiresFreezing = watch('storageCondition.requiresFreezing');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Item name is required' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              {...register('manufacturer')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter manufacturer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catalog Number
            </label>
            <input
              type="text"
              {...register('catalogNumber')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter catalog number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure *
            </label>
            <select
              {...register('unit', { required: 'Unit is required' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select unit</option>
              {units.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost
            </label>
            <input
              type="number"
              step="0.01"
              {...register('unitCost', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter item description"
          />
        </div>
      </div>

      {/* Stock Levels */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stock *
            </label>
            <input
              type="number"
              {...register('minimumStock', { 
                required: 'Minimum stock is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or greater' }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {errors.minimumStock && (
              <p className="text-red-500 text-sm mt-1">{errors.minimumStock.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Stock
            </label>
            <input
              type="number"
              {...register('maximumStock', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Point *
            </label>
            <input
              type="number"
              {...register('reorderPoint', { 
                required: 'Reorder point is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or greater' }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {errors.reorderPoint && (
              <p className="text-red-500 text-sm mt-1">{errors.reorderPoint.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Quantity *
            </label>
            <input
              type="number"
              {...register('reorderQuantity', { 
                required: 'Reorder quantity is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be 1 or greater' }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {errors.reorderQuantity && (
              <p className="text-red-500 text-sm mt-1">{errors.reorderQuantity.message}</p>
            )}
          </div>
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
              <input
                type="number"
                {...register('storageCondition.temperatureMin', { valueAsNumber: true })}
                className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
              <input
                type="number"
                {...register('storageCondition.temperatureMax', { valueAsNumber: true })}
                className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Humidity Requirements
            </label>
            <input
              type="text"
              {...register('storageCondition.humidity')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 30-60%"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('storageCondition.lightSensitive')}
              className="mr-2"
            />
            <span className="text-sm">Light sensitive</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('storageCondition.requiresRefrigeration')}
              className="mr-2"
            />
            <span className="text-sm">Requires refrigeration (2-8°C)</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('storageCondition.requiresFreezing')}
              className="mr-2"
            />
            <span className="text-sm">Requires freezing (-20°C or below)</span>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Storage Instructions
          </label>
          <textarea
            {...register('storageCondition.specialInstructions')}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any special storage instructions"
          />
        </div>
      </div>

      {/* Compliance & Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance & Tracking</h3>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('requiresLotTracking')}
              className="mr-2"
            />
            <span className="text-sm">Requires lot tracking</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('requiresExpirationTracking')}
              className="mr-2"
            />
            <span className="text-sm">Requires expiration date tracking</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('hazardous')}
              className="mr-2"
            />
            <span className="text-sm">Hazardous material</span>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MSDS URL
          </label>
          <input
            type="url"
            {...register('msdsUrl')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/msds/..."
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