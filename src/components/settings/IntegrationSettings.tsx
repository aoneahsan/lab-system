import React, { useState, useEffect } from 'react';
import type { IntegrationSettings as IntegrationSettingsType } from '../../services/settings';

interface IntegrationSettingsProps {
  settings: IntegrationSettingsType;
  onSave: (settings: IntegrationSettingsType) => void;
  isSaving: boolean;
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  settings,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<IntegrationSettingsType>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current: any = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setFormData(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">HL7 Integration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hl7Enabled"
              checked={formData.hl7Enabled}
              onChange={(e) => handleChange('hl7Enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hl7Enabled" className="ml-2 block text-sm text-gray-900">
              Enable HL7 interface
            </label>
          </div>

          {formData.hl7Enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                HL7 Version
              </label>
              <select
                value={formData.hl7Version}
                onChange={(e) => handleChange('hl7Version', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="2.3">HL7 v2.3</option>
                <option value="2.5">HL7 v2.5</option>
                <option value="2.7">HL7 v2.7</option>
                <option value="2.8">HL7 v2.8</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">FHIR Integration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fhirEnabled"
              checked={formData.fhirEnabled}
              onChange={(e) => handleChange('fhirEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fhirEnabled" className="ml-2 block text-sm text-gray-900">
              Enable FHIR interface
            </label>
          </div>

          {formData.fhirEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                FHIR Version
              </label>
              <select
                value={formData.fhirVersion}
                onChange={(e) => handleChange('fhirVersion', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="R4">FHIR R4</option>
                <option value="R5">FHIR R5</option>
                <option value="STU3">FHIR STU3</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="apiEnabled"
              checked={formData.apiEnabled}
              onChange={(e) => handleChange('apiEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="apiEnabled" className="ml-2 block text-sm text-gray-900">
              Enable REST API
            </label>
          </div>

          {formData.apiEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Rate Limit (requests per minute)
              </label>
              <input
                type="number"
                value={formData.apiRateLimit}
                onChange={(e) => handleChange('apiRateLimit', parseInt(e.target.value))}
                min="10"
                max="1000"
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="webhooksEnabled"
              checked={formData.webhooksEnabled}
              onChange={(e) => handleChange('webhooksEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="webhooksEnabled" className="ml-2 block text-sm text-gray-900">
              Enable webhooks
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">EMR Integration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="epicIntegration"
              checked={formData.emrIntegration.epic}
              onChange={(e) => handleChange('emrIntegration.epic', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="epicIntegration" className="ml-2 block text-sm text-gray-900">
              Epic MyChart
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="cernerIntegration"
              checked={formData.emrIntegration.cerner}
              onChange={(e) => handleChange('emrIntegration.cerner', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="cernerIntegration" className="ml-2 block text-sm text-gray-900">
              Cerner PowerChart
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allscriptsIntegration"
              checked={formData.emrIntegration.allscripts}
              onChange={(e) => handleChange('emrIntegration.allscripts', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allscriptsIntegration" className="ml-2 block text-sm text-gray-900">
              Allscripts
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="athenahealthIntegration"
              checked={formData.emrIntegration.athenahealth}
              onChange={(e) => handleChange('emrIntegration.athenahealth', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="athenahealthIntegration" className="ml-2 block text-sm text-gray-900">
              athenahealth
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">LIS Integration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="lisEnabled"
              checked={formData.lisIntegration.enabled}
              onChange={(e) => handleChange('lisIntegration.enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="lisEnabled" className="ml-2 block text-sm text-gray-900">
              Enable LIS integration
            </label>
          </div>

          {formData.lisIntegration.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  LIS Vendor
                </label>
                <input
                  type="text"
                  value={formData.lisIntegration.vendor}
                  onChange={(e) => handleChange('lisIntegration.vendor', e.target.value)}
                  placeholder="e.g., Sunquest, Cerner CoPath"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Connection Type
                </label>
                <select
                  value={formData.lisIntegration.connectionType}
                  onChange={(e) => handleChange('lisIntegration.connectionType', e.target.value as 'TCP' | 'FILE' | 'API')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="TCP">TCP/IP Socket</option>
                  <option value="FILE">File Transfer</option>
                  <option value="API">REST API</option>
                </select>
              </div>
            </>
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

export default IntegrationSettings;