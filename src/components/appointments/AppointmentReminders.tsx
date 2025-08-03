import { useState } from 'react';
import { 
  useAppointmentRemindersStatus, 
  useSendAppointmentReminder,
  useAppointmentTemplates
} from '@/hooks/useAppointmentReminders';
import { Appointment } from '@/types/appointment.types';

interface AppointmentRemindersProps {
  appointment: Appointment;
}

export function AppointmentReminders({ appointment }: AppointmentRemindersProps) {
  const { data: remindersStatus } = useAppointmentRemindersStatus(appointment.id);
  const { data: templates } = useAppointmentTemplates();
  const sendReminder = useSendAppointmentReminder();
  
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);

  const channelInfo = {
    sms: { icon: '💬', label: 'SMS', contact: appointment.patientPhone },
    whatsapp: { icon: '📱', label: 'WhatsApp', contact: appointment.patientPhone },
    email: { icon: '✉️', label: 'Email', contact: appointment.patientEmail }
  };

  const handleSendReminder = async () => {
    if (!selectedTemplateId) return;
    
    await sendReminder.mutateAsync({
      appointmentId: appointment.id,
      channel: selectedChannel,
      templateId: selectedTemplateId
    });
    
    setShowSendDialog(false);
  };

  const availableTemplates = templates?.filter(t => 
    t.channels.includes(selectedChannel) && t.isActive
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4">Appointment Reminders</h3>
      
      {/* Reminder Status */}
      <div className="space-y-3 mb-4">
        {Object.entries(channelInfo).map(([channel, info]) => {
          const sent = remindersStatus?.[channel as keyof typeof remindersStatus];
          const hasContact = !!info.contact;
          
          return (
            <div key={channel} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{info.icon}</span>
                <span className="font-medium">{info.label}</span>
                {!hasContact && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    (No {channel} contact)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {sent ? (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ✓ Sent
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Not sent
                  </span>
                )}
                {!sent && hasContact && (
                  <button
                    onClick={() => {
                      setSelectedChannel(channel as any);
                      setShowSendDialog(true);
                    }}
                    className="text-sm px-2 py-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Send Reminder Dialog */}
      {showSendDialog && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-medium mb-3">Send {channelInfo[selectedChannel].label} Reminder</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Select Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Choose a template</option>
                {availableTemplates?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Sending to: {channelInfo[selectedChannel].contact}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendReminder}
                disabled={!selectedTemplateId || sendReminder.isPending}
                className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
              >
                {sendReminder.isPending ? 'Sending...' : 'Send Reminder'}
              </button>
              <button
                onClick={() => setShowSendDialog(false)}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Patient Contact:</span>
          {appointment.patientPhone && <span className="ml-2">📱 {appointment.patientPhone}</span>}
          {appointment.patientEmail && <span className="ml-2">✉️ {appointment.patientEmail}</span>}
        </p>
      </div>
    </div>
  );
}