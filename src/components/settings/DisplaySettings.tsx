import React, { useState, useEffect } from 'react';
import type { DisplaySettings as DisplaySettingsType } from '../../services/settings';

interface DisplaySettingsProps {
  settings: DisplaySettingsType;
  onSave: (settings: DisplaySettingsType) => void;
  isSaving: boolean;
}

const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  settings,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<DisplaySettingsType>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof DisplaySettingsType, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Application Theme
            </label>
            <select
              value={formData.theme}
              onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark' | 'system')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <div className="mt-1 flex items-center space-x-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="h-10 w-20 rounded border-gray-300"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                placeholder="#3B82F6"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Layout Options</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo Position
            </label>
            <select
              value={formData.logoPosition}
              onChange={(e) => handleChange('logoPosition', e.target.value as 'left' | 'center')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="compactMode"
              checked={formData.compactMode}
              onChange={(e) => handleChange('compactMode', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="compactMode" className="ml-2 block text-sm text-gray-900">
              Enable compact mode (reduced spacing)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Landing Page
            </label>
            <select
              value={formData.defaultView}
              onChange={(e) => handleChange('defaultView', e.target.value as 'dashboard' | 'worklist' | 'patients')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="dashboard">Dashboard</option>
              <option value="worklist">Work List</option>
              <option value="patients">Patients</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Items Per Page
            </label>
            <select
              value={formData.itemsPerPage}
              onChange={(e) => handleChange('itemsPerPage', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPatientPhoto"
              checked={formData.showPatientPhoto}
              onChange={(e) => handleChange('showPatientPhoto', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showPatientPhoto" className="ml-2 block text-sm text-gray-900">
              Show patient photos in lists
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="graphicalReports"
              checked={formData.graphicalReports}
              onChange={(e) => handleChange('graphicalReports', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="graphicalReports" className="ml-2 block text-sm text-gray-900">
              Enable graphical elements in reports
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Value Colors</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Critical Value Color
            </label>
            <div className="mt-1 flex items-center space-x-3">
              <input
                type="color"
                value={formData.criticalValueColor}
                onChange={(e) => handleChange('criticalValueColor', e.target.value)}
                className="h-10 w-20 rounded border-gray-300"
              />
              <input
                type="text"
                value={formData.criticalValueColor}
                onChange={(e) => handleChange('criticalValueColor', e.target.value)}
                placeholder="#DC2626"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Color for critical test values</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Abnormal Value Color
            </label>
            <div className="mt-1 flex items-center space-x-3">
              <input
                type="color"
                value={formData.abnormalValueColor}
                onChange={(e) => handleChange('abnormalValueColor', e.target.value)}
                className="h-10 w-20 rounded border-gray-300"
              />
              <input
                type="text"
                value={formData.abnormalValueColor}
                onChange={(e) => handleChange('abnormalValueColor', e.target.value)}
                placeholder="#F59E0B"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Color for abnormal (non-critical) values</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Preview Note</h4>
        <p className="text-sm text-yellow-700">
          Some display changes may require a page refresh to take full effect. Theme changes will apply immediately to new sessions.
        </p>
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

export default DisplaySettings;