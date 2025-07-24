import React from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';

interface ValidationRuleFormData {
  testId: string;
  ruleType: 'range' | 'delta' | 'absurd' | 'critical' | 'custom';
  minValue?: number;
  maxValue?: number;
  deltaThreshold?: number;
  deltaType?: 'absolute' | 'percentage';
  deltaTimeframe?: number;
  absurdLow?: number;
  absurdHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  customRule?: string;
  customMessage?: string;
  action: 'warn' | 'block' | 'flag';
  requiresReview: boolean;
  notifyOnTrigger: boolean;
  active: boolean;
}

interface ValidationRuleFormProps {
  initialData?: Partial<ValidationRuleFormData>;
  testOptions: Array<{ id: string; name: string; code: string }>;
  onSubmit: (data: ValidationRuleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ValidationRuleForm: React.FC<ValidationRuleFormProps> = ({
  initialData,
  testOptions,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ValidationRuleFormData>({
    defaultValues: {
      active: true,
      requiresReview: false,
      notifyOnTrigger: false,
      action: 'warn',
      ruleType: 'range',
      deltaType: 'absolute',
      ...initialData
    }
  });

  const ruleType = watch('ruleType');
  const action = watch('action');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test *
            </label>
            <select
              {...register('testId', { required: 'Test is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a test</option>
              {testOptions.map(test => (
                <option key={test.id} value={test.id}>
                  {test.code} - {test.name}
                </option>
              ))}
            </select>
            {errors.testId && (
              <p className="mt-1 text-sm text-red-600">{errors.testId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rule Type *
            </label>
            <select
              {...register('ruleType', { required: 'Rule type is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="range">Range Check</option>
              <option value="delta">Delta Check</option>
              <option value="absurd">Absurd Values</option>
              <option value="critical">Critical Values</option>
              <option value="custom">Custom Rule</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rule Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rule Configuration</h3>
        
        {ruleType === 'range' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Value
              </label>
              <input
                type="number"
                step="any"
                {...register('minValue', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Value
              </label>
              <input
                type="number"
                step="any"
                {...register('maxValue', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {ruleType === 'delta' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delta Threshold
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('deltaThreshold', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delta Type
                </label>
                <select
                  {...register('deltaType')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="absolute">Absolute</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Timeframe (days)
              </label>
              <input
                type="number"
                {...register('deltaTimeframe', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Compare with results within this many days"
              />
            </div>
          </div>
        )}

        {ruleType === 'absurd' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Absurd Low Value
              </label>
              <input
                type="number"
                step="any"
                {...register('absurdLow', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Absurd High Value
              </label>
              <input
                type="number"
                step="any"
                {...register('absurdHigh', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {ruleType === 'critical' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Critical Low Value
              </label>
              <input
                type="number"
                step="any"
                {...register('criticalLow', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Critical High Value
              </label>
              <input
                type="number"
                step="any"
                {...register('criticalHigh', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {ruleType === 'custom' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Custom Rule Expression
              </label>
              <textarea
                {...register('customRule')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter custom validation logic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Custom Error Message
              </label>
              <input
                type="text"
                {...register('customMessage')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Validation Action *
            </label>
            <select
              {...register('action', { required: 'Action is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="warn">Warn - Show warning but allow result</option>
              <option value="block">Block - Prevent result entry</option>
              <option value="flag">Flag - Mark result for review</option>
            </select>
          </div>

          {action === 'warn' && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Warning action will display a message but allow the result to be saved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {action === 'block' && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    Block action will prevent the result from being saved until the issue is resolved.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('requiresReview')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Requires Review</label>
                <p className="text-gray-500">Mark results for mandatory review when this rule is triggered</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('notifyOnTrigger')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Send Notification</label>
                <p className="text-gray-500">Notify supervisors when this rule is triggered</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('active')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Active</label>
                <p className="text-gray-500">Enable this validation rule</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Rule'}
        </button>
      </div>
    </form>
  );
};

export default ValidationRuleForm;