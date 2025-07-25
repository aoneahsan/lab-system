import React, { useState, useEffect } from 'react';
import { SecuritySettings as SecuritySettingsType } from '../../services/settings';

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
  onSave: (settings: SecuritySettingsType) => void;
  isSaving: boolean;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<SecuritySettingsType>(settings);
  const [newIpAddress, setNewIpAddress] = useState('');

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

  const handleAddIpAddress = () => {
    if (newIpAddress && /^(\d{1,3}\.){3}\d{1,3}$/.test(newIpAddress)) {
      setFormData({
        ...formData,
        ipWhitelist: [...formData.ipWhitelist, newIpAddress]
      });
      setNewIpAddress('');
    }
  };

  const handleRemoveIpAddress = (ip: string) => {
    setFormData({
      ...formData,
      ipWhitelist: formData.ipWhitelist.filter(addr => addr !== ip)
    });
  };

  const handleMfaMethodToggle = (method: 'totp' | 'sms' | 'email' | 'biometric') => {
    const methods = formData.mfaMethods.includes(method)
      ? formData.mfaMethods.filter(m => m !== method)
      : [...formData.mfaMethods, method];
    handleChange('mfaMethods', methods);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Password Length
            </label>
            <input
              type="number"
              value={formData.passwordPolicy.minLength}
              onChange={(e) => handleChange('passwordPolicy.minLength', parseInt(e.target.value))}
              min="6"
              max="32"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password Expiration (days)
            </label>
            <input
              type="number"
              value={formData.passwordPolicy.expirationDays}
              onChange={(e) => handleChange('passwordPolicy.expirationDays', parseInt(e.target.value))}
              min="0"
              max="365"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Set to 0 to disable expiration</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password History
            </label>
            <input
              type="number"
              value={formData.passwordPolicy.preventReuse}
              onChange={(e) => handleChange('passwordPolicy.preventReuse', parseInt(e.target.value))}
              min="0"
              max="24"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Number of previous passwords to prevent reuse</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Password Requirements</label>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireUppercase"
              checked={formData.passwordPolicy.requireUppercase}
              onChange={(e) => handleChange('passwordPolicy.requireUppercase', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-900">
              Require uppercase letters
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireLowercase"
              checked={formData.passwordPolicy.requireLowercase}
              onChange={(e) => handleChange('passwordPolicy.requireLowercase', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireLowercase" className="ml-2 block text-sm text-gray-900">
              Require lowercase letters
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireNumbers"
              checked={formData.passwordPolicy.requireNumbers}
              onChange={(e) => handleChange('passwordPolicy.requireNumbers', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireNumbers" className="ml-2 block text-sm text-gray-900">
              Require numbers
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireSpecialChars"
              checked={formData.passwordPolicy.requireSpecialChars}
              onChange={(e) => handleChange('passwordPolicy.requireSpecialChars', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireSpecialChars" className="ml-2 block text-sm text-gray-900">
              Require special characters
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Multi-Factor Authentication</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="mfaRequired"
              checked={formData.mfaRequired}
              onChange={(e) => handleChange('mfaRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="mfaRequired" className="ml-2 block text-sm text-gray-900">
              Require MFA for all users
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed MFA Methods</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mfaTotp"
                  checked={formData.mfaMethods.includes('totp')}
                  onChange={() => handleMfaMethodToggle('totp')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mfaTotp" className="ml-2 block text-sm text-gray-900">
                  Authenticator App (TOTP)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mfaSms"
                  checked={formData.mfaMethods.includes('sms')}
                  onChange={() => handleMfaMethodToggle('sms')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mfaSms" className="ml-2 block text-sm text-gray-900">
                  SMS
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mfaEmail"
                  checked={formData.mfaMethods.includes('email')}
                  onChange={() => handleMfaMethodToggle('email')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mfaEmail" className="ml-2 block text-sm text-gray-900">
                  Email
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mfaBiometric"
                  checked={formData.mfaMethods.includes('biometric')}
                  onChange={() => handleMfaMethodToggle('biometric')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mfaBiometric" className="ml-2 block text-sm text-gray-900">
                  Biometric
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={formData.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
              min="5"
              max="480"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Audit Log Retention (days)
            </label>
            <input
              type="number"
              value={formData.auditLogRetention}
              onChange={(e) => handleChange('auditLogRetention', parseInt(e.target.value))}
              min="30"
              max="3650"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">IP Whitelist</h3>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
              placeholder="192.168.1.1"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddIpAddress}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add IP
            </button>
          </div>

          {formData.ipWhitelist.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.ipWhitelist.map((ip) => (
                <div key={ip} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm font-mono">{ip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIpAddress(ip)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Security</h3>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="dataEncryption"
              checked={formData.dataEncryption}
              onChange={(e) => handleChange('dataEncryption', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="dataEncryption" className="ml-2 block text-sm text-gray-900">
              Enable data encryption at rest
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="biometricEnabled"
              checked={formData.biometricEnabled}
              onChange={(e) => handleChange('biometricEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="biometricEnabled" className="ml-2 block text-sm text-gray-900">
              Enable biometric authentication on mobile devices
            </label>
          </div>
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

export default SecuritySettings;