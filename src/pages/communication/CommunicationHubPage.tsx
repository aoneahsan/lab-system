import { useState } from 'react';
import { useMessageTemplates, useCampaigns } from '@/hooks/useCommunication';
import { MessageTemplatesList } from '@/components/communication/MessageTemplatesList';
import { CampaignsList } from '@/components/communication/CampaignsList';
import { CommunicationChannels } from '@/components/communication/CommunicationChannels';
import { MessageHistory } from '@/components/communication/MessageHistory';
import { CommunicationAnalytics } from '@/components/communication/CommunicationAnalytics';

export default function CommunicationHubPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'channels' | 'history' | 'analytics'>('templates');
  const { data: templates, isLoading: templatesLoading } = useMessageTemplates();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();

  const tabs = [
    { id: 'templates', name: 'Message Templates', icon: '📝' },
    { id: 'campaigns', name: 'Campaigns', icon: '📢' },
    { id: 'channels', name: 'Channels', icon: '📡' },
    { id: 'history', name: 'Message History', icon: '📨' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communication Hub</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage SMS, WhatsApp, email, and push notification campaigns
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Templates</p>
              <p className="text-2xl font-bold">{templates?.filter(t => t.isActive).length || 0}</p>
            </div>
            <span className="text-3xl">📝</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Running Campaigns</p>
              <p className="text-2xl font-bold">{campaigns?.filter(c => c.status === 'running').length || 0}</p>
            </div>
            <span className="text-3xl">📢</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent Today</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <span className="text-3xl">📤</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</p>
              <p className="text-2xl font-bold">0%</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                {tab.name}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'templates' && (
          <MessageTemplatesList 
            templates={templates || []} 
            isLoading={templatesLoading} 
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignsList 
            campaigns={campaigns || []} 
            isLoading={campaignsLoading} 
          />
        )}

        {activeTab === 'channels' && (
          <CommunicationChannels />
        )}

        {activeTab === 'history' && (
          <MessageHistory />
        )}

        {activeTab === 'analytics' && (
          <CommunicationAnalytics />
        )}
      </div>
    </div>
  );
}