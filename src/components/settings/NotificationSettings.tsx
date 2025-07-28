import React, { useState, useEffect } from 'react';
import type { NotificationSettings as NotificationSettingsType } from '../../services/settings';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onSave: (settings: NotificationSettingsType) => void;
  isSaving: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSave,
  isSaving
}) => {
  const [formData, setFormData] = useState<NotificationSettingsType>(settings);

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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={formData.emailEnabled}
              onChange={(e) => handleChange('emailEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailEnabled" className="ml-2 block text-sm text-gray-900">
              Email Notifications
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="smsEnabled"
              checked={formData.smsEnabled}
              onChange={(e) => handleChange('smsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="smsEnabled" className="ml-2 block text-sm text-gray-900">
              SMS Notifications
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="pushEnabled"
              checked={formData.pushEnabled}
              onChange={(e) => handleChange('pushEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="pushEnabled" className="ml-2 block text-sm text-gray-900">
              Push Notifications
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="patientResultReady"
              checked={formData.patientNotifications.resultReady}
              onChange={(e) => handleChange('patientNotifications.resultReady', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="patientResultReady" className="ml-2 block text-sm text-gray-900">
              Notify when results are ready
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="patientAppointmentReminder"
              checked={formData.patientNotifications.appointmentReminder}
              onChange={(e) => handleChange('patientNotifications.appointmentReminder', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="patientAppointmentReminder" className="ml-2 block text-sm text-gray-900">
              Send appointment reminders
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="patientCriticalValue"
              checked={formData.patientNotifications.criticalValue}
              onChange={(e) => handleChange('patientNotifications.criticalValue', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="patientCriticalValue" className="ml-2 block text-sm text-gray-900">
              Alert on critical values
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Provider Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="providerCriticalValue"
              checked={formData.providerNotifications.criticalValue}
              onChange={(e) => handleChange('providerNotifications.criticalValue', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="providerCriticalValue" className="ml-2 block text-sm text-gray-900">
              Critical value alerts
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="providerResultReady"
              checked={formData.providerNotifications.resultReady}
              onChange={(e) => handleChange('providerNotifications.resultReady', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="providerResultReady" className="ml-2 block text-sm text-gray-900">
              Result ready notifications
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="providerQcAlert"
              checked={formData.providerNotifications.qcAlert}
              onChange={(e) => handleChange('providerNotifications.qcAlert', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="providerQcAlert" className="ml-2 block text-sm text-gray-900">
              Quality control alerts
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="staffLowInventory"
              checked={formData.staffNotifications.lowInventory}
              onChange={(e) => handleChange('staffNotifications.lowInventory', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="staffLowInventory" className="ml-2 block text-sm text-gray-900">
              Low inventory alerts
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="staffEquipmentMaintenance"
              checked={formData.staffNotifications.equipmentMaintenance}
              onChange={(e) => handleChange('staffNotifications.equipmentMaintenance', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="staffEquipmentMaintenance" className="ml-2 block text-sm text-gray-900">
              Equipment maintenance reminders
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="staffPendingTasks"
              checked={formData.staffNotifications.pendingTasks}
              onChange={(e) => handleChange('staffNotifications.pendingTasks', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="staffPendingTasks" className="ml-2 block text-sm text-gray-900">
              Pending task notifications
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Templates</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Configure notification templates in the Templates section. You can customize the subject and body for each notification type.
          </p>
          <button
            type="button"
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            onClick={() => {/* Navigate to templates */}}
          >
            Manage Templates →
          </button>
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

export default NotificationSettings;