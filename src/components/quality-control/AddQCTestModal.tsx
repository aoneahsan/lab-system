import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { useQualityControlStore } from '@/stores/quality-control.store';
import { toast } from 'react-hot-toast';
import { uiLogger } from '@/services/logger.service';

const qcLevelSchema = z.object({
  level: z.string().min(1, 'Level name is required'),
  expectedValue: z.number().min(0, 'Expected value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  acceptableRangeLow: z.number().min(0, 'Low range must be positive'),
  acceptableRangeHigh: z.number().min(0, 'High range must be positive'),
  warningRangeLow: z.number().min(0, 'Warning low range must be positive'),
  warningRangeHigh: z.number().min(0, 'Warning high range must be positive')
});

const qcTestSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'per_batch']),
  status: z.enum(['active', 'inactive', 'expired', 'discontinued']),
  testMethod: z.string().optional(),
  levels: z.array(qcLevelSchema).min(1, 'At least one level is required')
});

type QCTestFormData = z.infer<typeof qcTestSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddQCTestModal({ isOpen, onClose }: Props) {
  const { createQCTest } = useQualityControlStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control
  } = useForm<QCTestFormData>({
    resolver: zodResolver(qcTestSchema),
    defaultValues: {
      levels: [
        {
          level: 'Level 1',
          expectedValue: 0,
          unit: '',
          acceptableRangeLow: 0,
          acceptableRangeHigh: 0,
          warningRangeLow: 0,
          warningRangeHigh: 0
        }
      ],
      frequency: 'daily',
      status: 'active'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'levels'
  });

  const onSubmit = async (data: QCTestFormData) => {
    try {
      setIsSubmitting(true);
      
      await createQCTest({
        ...data,
        expirationDate: new Date(data.expirationDate),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('QC test added successfully');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to add QC test');
      uiLogger.error('Error adding QC test:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addLevel = () => {
    append({
      level: `Level ${fields.length + 1}`,
      expectedValue: 0,
      unit: '',
      acceptableRangeLow: 0,
      acceptableRangeHigh: 0,
      warningRangeLow: 0,
      warningRangeHigh: 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add QC Test</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Name *
              </label>
              <input
                type="text"
                {...register('testName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test name"
              />
              {errors.testName && (
                <p className="text-red-500 text-xs mt-1">{errors.testName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
              />
              {errors.manufacturer && (
                <p className="text-red-500 text-xs mt-1">{errors.manufacturer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number *
              </label>
              <input
                type="text"
                {...register('lotNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lot number"
              />
              {errors.lotNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.lotNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date *
              </label>
              <input
                type="date"
                {...register('expirationDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.expirationDate && (
                <p className="text-red-500 text-xs mt-1">{errors.expirationDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                {...register('frequency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="per_batch">Per Batch</option>
              </select>
              {errors.frequency && (
                <p className="text-red-500 text-xs mt-1">{errors.frequency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="discontinued">Discontinued</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Method
            </label>
            <input
              type="text"
              {...register('testMethod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter test method (optional)"
            />
          </div>

          {/* QC Levels */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">QC Levels *</label>
              <button
                type="button"
                onClick={addLevel}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Level
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Level {index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Level Name</label>
                      <input
                        type="text"
                        {...register(`levels.${index}.level`)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unit</label>
                      <input
                        type="text"
                        {...register(`levels.${index}.unit`)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="mg/dL, mmol/L, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expected Value</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`levels.${index}.expectedValue`, { valueAsNumber: true })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Acceptable Range Low</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`levels.${index}.acceptableRangeLow`, { valueAsNumber: true })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Acceptable Range High</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`levels.${index}.acceptableRangeHigh`, { valueAsNumber: true })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Warning Range Low</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`levels.${index}.warningRangeLow`, { valueAsNumber: true })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Warning Range High</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`levels.${index}.warningRangeHigh`, { valueAsNumber: true })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {errors.levels?.[index] && (
                    <p className="text-red-500 text-xs mt-2">Please fill all required fields</p>
                  )}
                </div>
              ))}
            </div>

            {errors.levels && (
              <p className="text-red-500 text-xs mt-1">{errors.levels.message}</p>
            )}
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
              {isSubmitting ? 'Adding...' : 'Add QC Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}