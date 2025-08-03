import { useState, useEffect } from 'react';
import { useCreateCampaign, useUpdateCampaign, useMessageTemplates } from '@/hooks/useCommunication';
import { Campaign, CampaignFormData } from '@/types/communication.types';

interface CampaignModalProps {
  campaign?: Campaign | null;
  onClose: () => void;
}

export default function CampaignModal({ campaign, onClose }: CampaignModalProps) {
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const { data: templates } = useMessageTemplates();
  
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    type: 'one_time',
    templateId: '',
    channels: [],
    audience: { type: 'all' },
    schedule: { startDate: new Date() }
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        templateId: campaign.templateId,
        channels: campaign.channels,
        audience: campaign.audience,
        schedule: campaign.schedule
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          data: formData
        });
      } else {
        await createCampaign.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  const selectedTemplate = templates?.find(t => t.id === formData.templateId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">
            {campaign ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="one_time">One Time</option>
                  <option value="recurring">Recurring</option>
                  <option value="automated">Automated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message Template</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => {
                    const template = templates?.find(t => t.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      templateId: e.target.value,
                      channels: template?.channels || []
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select a template</option>
                  {templates?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTemplate && (
              <div>
                <label className="block text-sm font-medium mb-2">Channels</label>
                <div className="flex gap-4">
                  {selectedTemplate.channels.map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...formData.channels, channel]
                            : formData.channels.filter(c => c !== channel);
                          setFormData({ ...formData, channels });
                        }}
                        className="mr-2"
                      />
                      <span className="capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="audienceType"
                    checked={formData.audience.type === 'all'}
                    onChange={() => setFormData({ ...formData, audience: { type: 'all' } })}
                    className="mr-2"
                  />
                  <span>All contacts</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="audienceType"
                    checked={formData.audience.type === 'segment'}
                    onChange={() => setFormData({ ...formData, audience: { type: 'segment' } })}
                    className="mr-2"
                  />
                  <span>Segmented audience</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="audienceType"
                    checked={formData.audience.type === 'individual'}
                    onChange={() => setFormData({ ...formData, audience: { type: 'individual' } })}
                    className="mr-2"
                  />
                  <span>Individual contacts</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Schedule</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.schedule.startDate ? new Date(formData.schedule.startDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, startDate: new Date(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    required
                  />
                </div>

                {formData.type !== 'one_time' && (
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.schedule.endDate ? new Date(formData.schedule.endDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, endDate: new Date(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                )}
              </div>

              {formData.type === 'recurring' && (
                <div className="mt-4">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                  <select
                    value={formData.schedule.frequency || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, frequency: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
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
              disabled={createCampaign.isPending || updateCampaign.isPending}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {createCampaign.isPending || updateCampaign.isPending ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}