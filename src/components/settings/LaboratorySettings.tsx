import React, { useState, useEffect } from 'react';
import type { LaboratorySettings as LaboratorySettingsType } from '../../services/settings';

interface LaboratorySettingsProps {
  settings: LaboratorySettingsType;
  onSave: (settings: LaboratorySettingsType) => void;
  isSaving: boolean;
}

const LaboratorySettings: React.FC<LaboratorySettingsProps> = ({
  settings,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<LaboratorySettingsType>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof LaboratorySettingsType, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Accession Number Format
            </label>
            <input
              type="text"
              value={formData.accessionNumberFormat}
              onChange={(e) => handleChange('accessionNumberFormat', e.target.value)}
              placeholder="e.g., YYYY-MM-DD-####"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use YYYY for year, MM for month, DD for day, #### for sequence
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Accession Number Prefix
            </label>
            <input
              type="text"
              value={formData.accessionNumberPrefix}
              onChange={(e) => handleChange('accessionNumberPrefix', e.target.value)}
              placeholder="e.g., LAB-"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Barcode Format
            </label>
            <select
              value={formData.barcodeFormat}
              onChange={(e) => handleChange('barcodeFormat', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="CODE128">Code 128</option>
              <option value="QR">QR Code</option>
              <option value="CODE39">Code 39</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sample ID Format
            </label>
            <input
              type="text"
              value={formData.sampleIdFormat}
              onChange={(e) => handleChange('sampleIdFormat', e.target.value)}
              placeholder="e.g., S-YYYY-######"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Result Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="resultValidationRequired"
              checked={formData.resultValidationRequired}
              onChange={(e) => handleChange('resultValidationRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="resultValidationRequired" className="ml-2 block text-sm text-gray-900">
              Require result validation before release
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowPartialResults"
              checked={formData.allowPartialResults}
              onChange={(e) => handleChange('allowPartialResults', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowPartialResults" className="ml-2 block text-sm text-gray-900">
              Allow partial result release
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Turnaround Time (hours)
            </label>
            <input
              type="number"
              value={formData.defaultTurnaroundTime}
              onChange={(e) => handleChange('defaultTurnaroundTime', parseInt(e.target.value))}
              min="1"
              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Critical Values</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="criticalValueNotification"
              checked={formData.criticalValueNotification}
              onChange={(e) => handleChange('criticalValueNotification', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="criticalValueNotification" className="ml-2 block text-sm text-gray-900">
              Enable critical value notifications
            </label>
          </div>

          {formData.criticalValueNotification && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Critical Value Acknowledgment Timeout (minutes)
              </label>
              <input
                type="number"
                value={formData.criticalValueTimeout}
                onChange={(e) => handleChange('criticalValueTimeout', parseInt(e.target.value))}
                min="5"
                max="60"
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Escalate if not acknowledged within this time
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableQualityControl"
              checked={formData.enableQualityControl}
              onChange={(e) => handleChange('enableQualityControl', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableQualityControl" className="ml-2 block text-sm text-gray-900">
              Enable quality control tracking
            </label>
          </div>

          {formData.enableQualityControl && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                QC Frequency
              </label>
              <select
                value={formData.qcFrequency}
                onChange={(e) => handleChange('qcFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default LaboratorySettings;