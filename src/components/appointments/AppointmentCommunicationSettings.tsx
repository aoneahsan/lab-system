import { useState } from 'react';
import { useAppointmentSettings, useUpdateAppointmentSettings } from '@/hooks/useAppointments';
import { useMessageTemplates } from '@/hooks/useCommunication';
import { useSendBulkReminders } from '@/hooks/useAppointmentReminders';

export function AppointmentCommunicationSettings() {
  const { data: settings, isLoading } = useAppointmentSettings();
  const { data: templates } = useMessageTemplates('appointment');
  const updateSettings = useUpdateAppointmentSettings();
  const sendBulkReminders = useSendBulkReminders();

  const [formData, setFormData] = useState({
    enableReminders: settings?.enableReminders ?? true,
    reminderChannels: settings?.reminderChannels ?? ['sms', 'email'],
    reminderTiming: settings?.reminderTiming ?? [24, 2],
    reminderTemplates: settings?.reminderTemplates ?? {}
  });

  const [bulkReminderConfig, setBulkReminderConfig] = useState({
    hoursInAdvance: 24,
    channel: 'sms' as 'sms' | 'whatsapp' | 'email',
    templateId: ''
  });

  const handleUpdateSettings = async () => {
    await updateSettings.mutateAsync({
      enableReminders: formData.enableReminders,
      reminderChannels: formData.reminderChannels,
      reminderTiming: formData.reminderTiming,
      reminderTemplates: formData.reminderTemplates
    });
  };

  const handleSendBulkReminders = async () => {
    if (!bulkReminderConfig.templateId) {
      return;
    }
    
    await sendBulkReminders.mutateAsync(bulkReminderConfig);
  };

  const toggleChannel = (channel: string) => {
    const channels = [...formData.reminderChannels];
    const index = channels.indexOf(channel);
    
    if (index > -1) {
      channels.splice(index, 1);
    } else {
      channels.push(channel);
    }
    
    setFormData({ ...formData, reminderChannels: channels });
  };

  const updateReminderTiming = (index: number, value: number) => {
    const timing = [...formData.reminderTiming];
    timing[index] = value;
    setFormData({ ...formData, reminderTiming: timing });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Appointment Communication Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure how appointment reminders and notifications are sent to patients
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4">Reminder Settings</h3>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.enableReminders}
              onChange={(e) => setFormData({ ...formData, enableReminders: e.target.checked })}
              className="mr-3"
            />
            <span>Enable automatic appointment reminders</span>
          </label>

          {formData.enableReminders && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Reminder Channels</label>
                <div className="space-y-2">
                  {['sms', 'email', 'whatsapp'].map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.reminderChannels.includes(channel)}
                        onChange={() => toggleChannel(channel)}
                        className="mr-2"
                      />
                      <span className="capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reminder Timing (hours before appointment)</label>
                <div className="space-y-2">
                  {formData.reminderTiming.map((hours, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={hours}
                        onChange={(e) => updateReminderTiming(index, parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        min="1"
                        max="168"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">hours before</span>
                      {formData.reminderTiming.length > 1 && (
                        <button
                          onClick={() => {
                            const timing = formData.reminderTiming.filter((_, i) => i !== index);
                            setFormData({ ...formData, reminderTiming: timing });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        reminderTiming: [...formData.reminderTiming, 24] 
                      });
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add reminder time
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Templates</label>
                <div className="space-y-3">
                  {formData.reminderChannels.map((channel) => (
                    <div key={channel}>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                        {channel} Template
                      </label>
                      <select
                        value={formData.reminderTemplates[channel] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          reminderTemplates: {
                            ...formData.reminderTemplates,
                            [channel]: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="">Select template</option>
                        {templates
                          ?.filter(t => t.channels.includes(channel as any))
                          .map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleUpdateSettings}
            disabled={updateSettings.isPending}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Bulk Reminder Sending */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4">Send Bulk Reminders</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Send reminders to all patients with upcoming appointments
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hours in Advance</label>
            <input
              type="number"
              value={bulkReminderConfig.hoursInAdvance}
              onChange={(e) => setBulkReminderConfig({
                ...bulkReminderConfig,
                hoursInAdvance: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              min="1"
              max="168"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Channel</label>
            <select
              value={bulkReminderConfig.channel}
              onChange={(e) => setBulkReminderConfig({
                ...bulkReminderConfig,
                channel: e.target.value as any
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Template</label>
            <select
              value={bulkReminderConfig.templateId}
              onChange={(e) => setBulkReminderConfig({
                ...bulkReminderConfig,
                templateId: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Select template</option>
              {templates
                ?.filter(t => t.channels.includes(bulkReminderConfig.channel))
                .map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSendBulkReminders}
          disabled={sendBulkReminders.isPending || !bulkReminderConfig.templateId}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {sendBulkReminders.isPending ? 'Sending...' : 'Send Bulk Reminders'}
        </button>
      </div>

      {/* Template Preview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-medium">Available Variables:</span> {`{{patientName}}`}, {`{{appointmentDate}}`}, 
          {` {{appointmentTime}}`}, {`{{providerName}}`}, {`{{location}}`}, {`{{duration}}`}, {`{{testNames}}`}
        </p>
      </div>
    </div>
  );
}