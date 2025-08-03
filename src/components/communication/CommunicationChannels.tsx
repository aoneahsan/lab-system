import { useState } from 'react';
import { useCommunicationChannels, useUpdateChannel } from '@/hooks/useCommunication';
import { CommunicationChannel } from '@/types/communication.types';

export function CommunicationChannels() {
  const { data: channels, isLoading } = useCommunicationChannels();
  const updateChannel = useUpdateChannel();
  const [editingChannel, setEditingChannel] = useState<string | null>(null);

  const channelIcons = {
    sms: '💬',
    whatsapp: '📱',
    email: '✉️',
    push: '🔔'
  };

  const handleToggleActive = async (channel: CommunicationChannel) => {
    await updateChannel.mutateAsync({
      id: channel.id,
      data: { isActive: !channel.isActive }
    });
  };

  const handleSaveConfiguration = async (channel: CommunicationChannel, config: any) => {
    await updateChannel.mutateAsync({
      id: channel.id,
      data: { configuration: config }
    });
    setEditingChannel(null);
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
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Communication Channels</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure your communication channels for sending messages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['sms', 'whatsapp', 'email', 'push'] as const).map((type) => {
          const channel = channels?.find(c => c.type === type);
          const isEditing = editingChannel === type;

          return (
            <div
              key={type}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{channelIcons[type]}</span>
                  <div>
                    <h3 className="text-lg font-medium capitalize">{type} Channel</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {channel?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channel?.isActive || false}
                    onChange={() => channel && handleToggleActive(channel)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {channel?.isActive && (
                <div className="space-y-4">
                  {type === 'sms' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">SMS Provider</label>
                        <select
                          value={channel.configuration.smsProvider || ''}
                          onChange={(e) => setEditingChannel(type)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        >
                          <option value="">Select provider</option>
                          <option value="twilio">Twilio</option>
                          <option value="sendgrid">SendGrid</option>
                          <option value="aws_sns">AWS SNS</option>
                        </select>
                      </div>
                      {channel.configuration.smsProvider && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          ✓ Configured with {channel.configuration.smsProvider}
                        </div>
                      )}
                    </>
                  )}

                  {type === 'whatsapp' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">WhatsApp Business ID</label>
                        <input
                          type="text"
                          value={channel.configuration.whatsappBusinessId || ''}
                          onChange={(e) => setEditingChannel(type)}
                          placeholder="Enter Business ID"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        />
                      </div>
                      {channel.configuration.whatsappBusinessId && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          ✓ WhatsApp Business configured
                        </div>
                      )}
                    </>
                  )}

                  {type === 'email' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email Provider</label>
                        <select
                          value={channel.configuration.emailProvider || ''}
                          onChange={(e) => setEditingChannel(type)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        >
                          <option value="">Select provider</option>
                          <option value="sendgrid">SendGrid</option>
                          <option value="aws_ses">AWS SES</option>
                          <option value="smtp">SMTP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">From Email</label>
                        <input
                          type="email"
                          value={channel.configuration.emailFromAddress || ''}
                          onChange={(e) => setEditingChannel(type)}
                          placeholder="noreply@labflow.com"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        />
                      </div>
                    </>
                  )}

                  {type === 'push' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Push Provider</label>
                        <select
                          value={channel.configuration.pushProvider || ''}
                          onChange={(e) => setEditingChannel(type)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        >
                          <option value="">Select provider</option>
                          <option value="firebase">Firebase</option>
                          <option value="onesignal">OneSignal</option>
                        </select>
                      </div>
                      {channel.configuration.pushProvider && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          ✓ Push notifications configured with {channel.configuration.pushProvider}
                        </div>
                      )}
                    </>
                  )}

                  {isEditing && (
                    <button
                      onClick={() => handleSaveConfiguration(channel, channel.configuration)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      Save Configuration
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-medium">Note:</span> Full configuration of communication channels requires API credentials. 
          Contact your administrator to complete the setup.
        </p>
      </div>
    </div>
  );
}