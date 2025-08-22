import { useState, useEffect } from 'react';
import { useCreateTemplate, useUpdateTemplate } from '@/hooks/useCommunication';
import { MessageTemplate, MessageTemplateFormData } from '@/types/communication.types';
import { uiLogger } from '@/services/logger.service';

interface MessageTemplateModalProps {
  template?: MessageTemplate | null;
  onClose: () => void;
}

export default function MessageTemplateModal({ template, onClose }: MessageTemplateModalProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  
  const [formData, setFormData] = useState<MessageTemplateFormData>({
    name: '',
    description: '',
    category: 'general',
    channels: [],
    content: {},
    isActive: true
  });

  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | 'email' | 'push'>('sms');

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        channels: template.channels,
        content: template.content,
        triggers: template.triggers,
        isActive: template.isActive
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          data: formData
        });
      } else {
        await createTemplate.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      uiLogger.error('Failed to save template:', error);
    }
  };

  const toggleChannel = (channel: typeof selectedChannel) => {
    const channels = [...formData.channels];
    const index = channels.indexOf(channel);
    
    if (index > -1) {
      channels.splice(index, 1);
      const newContent = { ...formData.content };
      delete newContent[channel];
      setFormData({ ...formData, channels, content: newContent });
    } else {
      channels.push(channel);
      setFormData({ ...formData, channels });
    }
  };

  const updateChannelContent = (channel: typeof selectedChannel, field: string, value: any) => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [channel]: {
          ...formData.content[channel],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">
            {template ? 'Edit Message Template' : 'Create Message Template'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="appointment">Appointment</option>
                <option value="result">Result</option>
                <option value="billing">Billing</option>
                <option value="marketing">Marketing</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              rows={3}
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Channels</label>
            <div className="flex gap-4">
              {(['sms', 'whatsapp', 'email', 'push'] as const).map((channel) => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="mr-2"
                  />
                  <span className="capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.channels.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Message Content</label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  {formData.channels.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setSelectedChannel(channel)}
                      className={`px-4 py-2 capitalize ${
                        selectedChannel === channel
                          ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {selectedChannel === 'sms' && (
                    <div>
                      <textarea
                        value={formData.content.sms?.body || ''}
                        onChange={(e) => updateChannelContent('sms', 'body', e.target.value)}
                        placeholder="SMS message content. Use {{variable}} for dynamic content."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        rows={4}
                      />
                    </div>
                  )}

                  {selectedChannel === 'whatsapp' && (
                    <div className="space-y-4">
                      <textarea
                        value={formData.content.whatsapp?.body || ''}
                        onChange={(e) => updateChannelContent('whatsapp', 'body', e.target.value)}
                        placeholder="WhatsApp message content. Use {{variable}} for dynamic content."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        rows={4}
                      />
                      <input
                        type="url"
                        value={formData.content.whatsapp?.mediaUrl || ''}
                        onChange={(e) => updateChannelContent('whatsapp', 'mediaUrl', e.target.value)}
                        placeholder="Media URL (optional)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                    </div>
                  )}

                  {selectedChannel === 'email' && (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={formData.content.email?.subject || ''}
                        onChange={(e) => updateChannelContent('email', 'subject', e.target.value)}
                        placeholder="Email subject"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                      <textarea
                        value={formData.content.email?.body || ''}
                        onChange={(e) => updateChannelContent('email', 'body', e.target.value)}
                        placeholder="Email body (HTML). Use {{variable}} for dynamic content."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        rows={6}
                      />
                    </div>
                  )}

                  {selectedChannel === 'push' && (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={formData.content.push?.title || ''}
                        onChange={(e) => updateChannelContent('push', 'title', e.target.value)}
                        placeholder="Notification title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                      <textarea
                        value={formData.content.push?.body || ''}
                        onChange={(e) => updateChannelContent('push', 'body', e.target.value)}
                        placeholder="Notification body. Use {{variable}} for dynamic content."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTemplate.isPending || updateTemplate.isPending}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {createTemplate.isPending || updateTemplate.isPending ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}