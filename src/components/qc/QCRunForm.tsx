import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, Thermometer, Droplets, Save } from 'lucide-react';
import { useQCMaterials, useQCMaterial } from '@/hooks/useQC';
import type { QCRunFormData, QCMaterial, Shift } from '@/types/qc.types';

interface QCRunFormProps {
  onSubmit: (data: QCRunFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const QCRunForm: React.FC<QCRunFormProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<QCMaterial | null>(null);
  const { data: materials = [] } = useQCMaterials();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<QCRunFormData>({
    defaultValues: {
      runDate: new Date(),
      shift: 'day' as Shift,
      results: [],
    },
  });

  const materialId = watch('materialId');
  const { data: material } = useQCMaterial(materialId);

  useEffect(() => {
    if (material) {
      setSelectedMaterial(material);
      // Initialize results for all analytes
      setValue('results', material.analytes.map(analyte => ({
        testCode: analyte.testCode,
        value: 0,
      })));
    }
  }, [material, setValue]);

  const updateResult = (testCode: string, value: number) => {
    const results = watch('results');
    const updatedResults = results.map(r => 
      r.testCode === testCode ? { ...r, value } : r
    );
    setValue('results', updatedResults);
  };

  const getShiftFromTime = (date: Date): Shift => {
    const hour = date.getHours();
    if (hour >= 7 && hour < 15) return 'day';
    if (hour >= 15 && hour < 23) return 'evening';
    return 'night';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Material Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">QC Material</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Material *
            </label>
            <select
              {...register('materialId', { required: 'Material is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select material...</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} - {material.lotNumber} (Level {material.level})
                </option>
              ))}
            </select>
            {errors.materialId && (
              <p className="mt-1 text-sm text-red-600">{errors.materialId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Run Date/Time *
            </label>
            <input
              type="datetime-local"
              {...register('runDate', { 
                required: 'Run date is required',
                valueAsDate: true,
              })}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setValue('shift', getShiftFromTime(date));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.runDate && (
              <p className="mt-1 text-sm text-red-600">{errors.runDate.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Shift *
            </label>
            <select
              {...register('shift', { required: 'Shift is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="day">Day (7AM-3PM)</option>
              <option value="evening">Evening (3PM-11PM)</option>
              <option value="night">Night (11PM-7AM)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Thermometer className="inline h-4 w-4 mr-1" />
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('temperature', { 
                min: { value: 15, message: 'Temperature too low' },
                max: { value: 30, message: 'Temperature too high' },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="22.5"
            />
            {errors.temperature && (
              <p className="mt-1 text-sm text-red-600">{errors.temperature.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Droplets className="inline h-4 w-4 mr-1" />
              Humidity (%)
            </label>
            <input
              type="number"
              {...register('humidity', {
                min: { value: 20, message: 'Humidity too low' },
                max: { value: 80, message: 'Humidity too high' },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="45"
            />
            {errors.humidity && (
              <p className="mt-1 text-sm text-red-600">{errors.humidity.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Results Entry */}
      {selectedMaterial && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            QC Results
          </h3>
          
          <div className="space-y-4">
            {selectedMaterial.analytes.map((analyte) => (
              <div key={analyte.testCode} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {analyte.testName}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Target: {analyte.targetMean} ± {analyte.targetSD} {analyte.unit}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Result *
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        onChange={(e) => updateResult(analyte.testCode, parseFloat(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-sm text-gray-500">{analyte.unit}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">
                      Range: {analyte.acceptableRange.min} - {analyte.acceptableRange.max}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">
                      CV: {analyte.targetCV ? `${analyte.targetCV}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white shadow rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Comments
          </label>
          <textarea
            {...register('comments')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Any observations or notes..."
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
          disabled={isLoading || !selectedMaterial}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save QC Run'}
        </button>
      </div>
    </form>
  );
};

export default QCRunForm;