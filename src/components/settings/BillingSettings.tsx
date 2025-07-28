import React, { useState, useEffect } from 'react';
import type { BillingSettings as BillingSettingsType } from '../../services/settings';

interface BillingSettingsProps {
  settings: BillingSettingsType;
  onSave: (settings: BillingSettingsType) => void;
  isSaving: boolean;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState<BillingSettingsType>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof BillingSettingsType, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Configuration</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="taxEnabled"
              checked={formData.taxEnabled}
              onChange={(e) => handleChange('taxEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="taxEnabled" className="ml-2 block text-sm text-gray-900">
              Enable tax calculation
            </label>
          </div>

          {formData.taxEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Terms</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Payment Terms (days)
            </label>
            <input
              type="number"
              value={formData.defaultPaymentTerms}
              onChange={(e) => handleChange('defaultPaymentTerms', parseInt(e.target.value))}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Billing Code System</label>
            <select
              value={formData.billingCodeSystem}
              onChange={(e) =>
                handleChange('billingCodeSystem', e.target.value as 'CPT' | 'ICD10' | 'CUSTOM')
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="CPT">CPT Codes</option>
              <option value="ICD10">ICD-10</option>
              <option value="CUSTOM">Custom Codes</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Processing</h3>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="insuranceClaimsEnabled"
            checked={formData.insuranceClaimsEnabled}
            onChange={(e) => handleChange('insuranceClaimsEnabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="insuranceClaimsEnabled" className="ml-2 block text-sm text-gray-900">
            Enable insurance claims processing
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Late Fees</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="lateFeeEnabled"
              checked={formData.lateFeeEnabled}
              onChange={(e) => handleChange('lateFeeEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="lateFeeEnabled" className="ml-2 block text-sm text-gray-900">
              Enable late fee charges
            </label>
          </div>

          {formData.lateFeeEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Late Fee Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.lateFeePercentage}
                  onChange={(e) => handleChange('lateFeePercentage', parseFloat(e.target.value))}
                  min="0"
                  max="50"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grace Period (days)
                </label>
                <input
                  type="number"
                  value={formData.lateFeeGracePeriod}
                  onChange={(e) => handleChange('lateFeeGracePeriod', parseInt(e.target.value))}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Discounts</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="discountEnabled"
              checked={formData.discountEnabled}
              onChange={(e) => handleChange('discountEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="discountEnabled" className="ml-2 block text-sm text-gray-900">
              Allow discounts
            </label>
          </div>

          {formData.discountEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Discount Percentage (%)
              </label>
              <input
                type="number"
                value={formData.maxDiscountPercentage}
                onChange={(e) => handleChange('maxDiscountPercentage', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="1"
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
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

export default BillingSettings;
