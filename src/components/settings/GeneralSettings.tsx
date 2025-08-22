import React, { useState, useEffect } from 'react';
import type { GeneralSettings as GeneralSettingsType } from '../../services/settings';
import { TextField, UrlField, EmailField, CustomPhoneField, SelectField, ZipCodeField, CountryField, StateField, CityField } from '@/components/form-fields';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onSave: (settings: GeneralSettingsType) => void;
  isSaving: boolean;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState<GeneralSettingsType>(settings);

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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Laboratory Information</h3>

        <div className="grid grid-cols-1 gap-6">
          <TextField
            label="Laboratory Name"
            name="labName"
            value={formData.labName}
            onChange={(value) => handleChange('labName', value)}
            required
            showLabel
          />

          <UrlField
            label="Logo URL"
            name="labLogo"
            value={formData.labLogo}
            onChange={(value) => handleChange('labLogo', value)}
            showLabel
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <TextField
              label="Street Address"
              name="address.street"
              value={formData.address.street}
              onChange={(value) => handleChange('address.street', value)}
              showLabel
            />
          </div>

          <CityField
            label="City"
            name="address.city"
            value={formData.address.city}
            onChange={(value) => handleChange('address.city', value)}
            showLabel
          />

          <StateField
            label="State"
            name="address.state"
            value={formData.address.state}
            onChange={(value) => handleChange('address.state', value)}
            showLabel
          />

          <ZipCodeField
            label="ZIP Code"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={(value) => handleChange('address.zipCode', value)}
            showLabel
          />

          <CountryField
            label="Country"
            name="address.country"
            value={formData.address.country}
            onChange={(value) => handleChange('address.country', value)}
            showLabel
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PhoneField
            label="Phone"
            name="contact.phone"
            value={formData.contact.phone}
            onChange={(value) => handleChange('contact.phone', value)}
            showLabel
          />

          <EmailField
            label="Email"
            name="contact.email"
            value={formData.contact.email}
            onChange={(value) => handleChange('contact.email', value)}
            showLabel
          />

          <UrlField
            label="Website"
            name="contact.website"
            value={formData.contact.website}
            onChange={(value) => handleChange('contact.website', value)}
            showLabel
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Timezone"
            name="timezone"
            value={formData.timezone}
            onChange={(value) => handleChange('timezone', value)}
            options={[
              { value: 'America/New_York', label: 'Eastern Time' },
              { value: 'America/Chicago', label: 'Central Time' },
              { value: 'America/Denver', label: 'Mountain Time' },
              { value: 'America/Los_Angeles', label: 'Pacific Time' },
              { value: 'Europe/London', label: 'London' },
              { value: 'Europe/Paris', label: 'Paris' },
              { value: 'Asia/Tokyo', label: 'Tokyo' },
              { value: 'Australia/Sydney', label: 'Sydney' },
            ]}
            showLabel
          />

          <SelectField
            label="Currency"
            name="currency"
            value={formData.currency}
            onChange={(value) => handleChange('currency', value)}
            options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'JPY', label: 'JPY (¥)' },
              { value: 'AUD', label: 'AUD ($)' },
              { value: 'CAD', label: 'CAD ($)' },
            ]}
            showLabel
          />

          <SelectField
            label="Date Format"
            name="dateFormat"
            value={formData.dateFormat}
            onChange={(value) => handleChange('dateFormat', value)}
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            ]}
            showLabel
          />

          <SelectField
            label="Time Format"
            name="timeFormat"
            value={formData.timeFormat}
            onChange={(value) => handleChange('timeFormat', value)}
            options={[
              { value: '12h', label: '12 Hour' },
              { value: '24h', label: '24 Hour' },
            ]}
            showLabel
          />
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

export default GeneralSettings;
