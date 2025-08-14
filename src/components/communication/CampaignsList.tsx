import { useState, useEffect } from 'react';
import { Campaign } from '@/types/communication.types';
import { useStartCampaign, usePauseCampaign } from '@/hooks/useCommunication';
import { useModalState } from '@/hooks/useModalState';
import CampaignModal from './CampaignModal';

interface CampaignsListProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export function CampaignsList({ campaigns, isLoading }: CampaignsListProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const campaignModal = useModalState('campaign');
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    running: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const handleStart = async (id: string) => {
    await startCampaign.mutateAsync(id);
  };

  const handlePause = async (id: string) => {
    await pauseCampaign.mutateAsync(id);
  };

  // Restore campaign from URL on modal open
  useEffect(() => {
    if (campaignModal.isOpen && campaignModal.modalData.campaignId && campaigns) {
      const campaign = campaigns.find(c => c.id === campaignModal.modalData.campaignId);
      if (campaign) setSelectedCampaign(campaign);
    } else if (!campaignModal.isOpen) {
      setSelectedCampaign(null);
    }
  }, [campaignModal.isOpen, campaignModal.modalData, campaigns]);

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    campaignModal.openModal({ campaignId: campaign.id });
  };

  const handleCloseModal = () => {
    setSelectedCampaign(null);
    campaignModal.closeModal();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <button
          onClick={() => campaignModal.openModal()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No campaigns found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Create your first campaign to start sending messages
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {campaign.name}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {campaign.description}
                  </p>

                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Type:</span>
                      <span className="ml-2 text-gray-900 dark:text-white capitalize">
                        {campaign.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Audience:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {campaign.audience.type === 'all' ? 'All contacts' : 
                         campaign.audience.type === 'segment' ? 'Segmented' : 
                         `${campaign.audience.individualIds?.length || 0} contacts`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-500">Channels:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {campaign.channels.join(', ')}
                      </span>
                    </div>
                  </div>

                  {campaign.status === 'running' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Sent</p>
                        <p className="text-lg font-semibold">{campaign.metrics.totalSent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Delivered</p>
                        <p className="text-lg font-semibold">{campaign.metrics.delivered}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Opened</p>
                        <p className="text-lg font-semibold">{campaign.metrics.opened}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Failed</p>
                        <p className="text-lg font-semibold">{campaign.metrics.failed}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {campaign.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleStart(campaign.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Start
                      </button>
                    </>
                  )}
                  {campaign.status === 'running' && (
                    <button
                      onClick={() => handlePause(campaign.id)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Pause
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={() => handleStart(campaign.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {campaignModal.isOpen && (
        <CampaignModal
          campaign={selectedCampaign}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}