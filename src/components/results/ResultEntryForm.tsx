import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FlaskRound, AlertCircle, AlertTriangle } from 'lucide-react';
import { useSample } from '@/hooks/useSamples';
import { useTest } from '@/hooks/useTests';
import { usePatient } from '@/hooks/usePatients';
import { useValidateResult } from '@/hooks/useResultValidation';
import type { ResultEntryFormData, ResultFlag } from '@/types/result.types';

interface ResultEntryFormProps {
  orderId: string;
  sampleId: string;
  testId: string;
  onSubmit: (data: ResultEntryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ResultEntryForm: React.FC<ResultEntryFormProps> = ({
  orderId,
  sampleId,
  testId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [showCriticalWarning, setShowCriticalWarning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  const { data: sample } = useSample(sampleId);
  const { data: test } = useTest(testId);
  const { data: patient } = usePatient(sample?.patientId || '');
  const validateResult = useValidateResult();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ResultEntryFormData>({
    defaultValues: {
      orderId,
      sampleId,
      testId,
      value: '',
      unit: test?.unit || '',
      flag: 'normal',
    },
  });

  const value = watch('value');
  const flag = watch('flag');

  useEffect(() => {
    if (test?.unit) {
      setValue('unit', test.unit);
    }
  }, [test, setValue]);

  useEffect(() => {
    if (flag === 'critical_high' || flag === 'critical_low') {
      setShowCriticalWarning(true);
    }
  }, [flag]);

  // Validate on value change
  useEffect(() => {
    if (value && test && patient) {
      const validateAsync = async () => {
        const result = await validateResult.mutateAsync({
          testId,
          value,
          patientId: patient.id,
          referenceRange: test.referenceRange
        });

        setValidationErrors(result.errors);
        setValidationWarnings(result.warnings);
        
        // Auto-set flag based on validation
        if (result.flags.length > 0 && !flag) {
          setValue('flag', result.flags[0]);
        }
        
        setShowCriticalWarning(result.isCritical);
      };
      
      validateAsync();
    }
  }, [value, test, patient, testId, flag, setValue, validateResult]);

  const onFormSubmit = async (data: ResultEntryFormData) => {
    // Final validation before submit
    if (test && patient) {
      const result = await validateResult.mutateAsync({
        testId,
        value: data.value,
        patientId: patient.id,
        referenceRange: test.referenceRange
      });
      
      if (!result.isValid) {
        return; // Don't submit if validation fails
      }
    }
    
    onSubmit(data);
  };

  const resultFlags: { value: ResultFlag; label: string; color: string }[] = [
    { value: 'normal', label: 'Normal', color: 'text-green-600' },
    { value: 'abnormal', label: 'Abnormal', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'low', label: 'Low', color: 'text-orange-600' },
    { value: 'critical_high', label: 'Critical High', color: 'text-red-600' },
    { value: 'critical_low', label: 'Critical Low', color: 'text-red-600' },
  ];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Test Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FlaskRound className="h-5 w-5" />
          Test Information
        </h3>
        
        {test && sample && (
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Test:</p>
                <p>{test.name} ({test.code})</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Sample:</p>
                <p>{sample.sampleNumber} - {sample.type}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Specimen Type:</p>
                <p>{test.specimenType}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Method:</p>
                <p>{test.methodology || 'Standard'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result Entry */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Result Entry</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Result Value *
            </label>
            <input
              type="text"
              {...register('value', { required: 'Result value is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter result"
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit
            </label>
            <input
              type="text"
              {...register('unit')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., mg/dL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Flag *
            </label>
            <select
              {...register('flag')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {resultFlags.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Method
            </label>
            <input
              type="text"
              {...register('method')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Test method"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instrument ID
            </label>
            <input
              type="text"
              {...register('instrumentId')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., INST-001"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Comments
            </label>
            <textarea
              {...register('comments')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Additional comments or notes..."
            />
          </div>
        </div>

        {/* Reference Range Display */}
        {test?.referenceRange && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Reference Range:</p>
            <p className="text-sm text-gray-600">
              {test.referenceRange.min} - {test.referenceRange.max} {test.referenceRange.unit}
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Validation Errors</p>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Validation Warnings</p>
                <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                  {validationWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Critical Value Warning */}
        {showCriticalWarning && (
          <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Critical Value Alert</p>
              <p className="text-sm text-red-700 mt-1">
                This result has been flagged as critical. Immediate notification to the ordering physician is required.
              </p>
            </div>
          </div>
        )}
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
          disabled={isLoading || validationErrors.length > 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Result'}
        </button>
      </div>
    </form>
  );
};

export default ResultEntryForm;