import { useState } from 'react';
import { useMessages, useCampaigns } from '@/hooks/useCommunication';

export function CommunicationAnalytics() {
  const [dateRange, setDateRange] = useState('week');
  const { data: messages } = useMessages();
  const { data: campaigns } = useCampaigns();

  // Calculate analytics from messages
  const analytics = {
    totalSent: messages?.length || 0,
    delivered: messages?.filter(m => m.status === 'delivered' || m.status === 'read').length || 0,
    failed: messages?.filter(m => m.status === 'failed' || m.status === 'bounced').length || 0,
    read: messages?.filter(m => m.status === 'read').length || 0,
    channelBreakdown: {
      sms: messages?.filter(m => m.channel === 'sms').length || 0,
      whatsapp: messages?.filter(m => m.channel === 'whatsapp').length || 0,
      email: messages?.filter(m => m.channel === 'email').length || 0,
      push: messages?.filter(m => m.channel === 'push').length || 0
    }
  };

  const deliveryRate = analytics.totalSent > 0 
    ? Math.round((analytics.delivered / analytics.totalSent) * 100) 
    : 0;

  const readRate = analytics.delivered > 0 
    ? Math.round((analytics.read / analytics.delivered) * 100) 
    : 0;

  const activeCampaigns = campaigns?.filter(c => c.status === 'running').length || 0;
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Communication Analytics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your communication performance metrics
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="quarter">Last 90 days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
              <p className="text-3xl font-bold mt-2">{analytics.totalSent}</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</p>
              <p className="text-3xl font-bold mt-2">{deliveryRate}%</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Read Rate</p>
              <p className="text-3xl font-bold mt-2">{readRate}%</p>
            </div>
            <span className="text-4xl">👁️</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed Messages</p>
              <p className="text-3xl font-bold mt-2">{analytics.failed}</p>
            </div>
            <span className="text-4xl">❌</span>
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4">Channel Performance</h3>
        <div className="space-y-4">
          {Object.entries(analytics.channelBreakdown).map(([channel, count]) => {
            const percentage = analytics.totalSent > 0 
              ? Math.round((count / analytics.totalSent) * 100) 
              : 0;
            
            return (
              <div key={channel}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{channel}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {count} messages ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">Campaign Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</span>
              <span className="text-2xl font-bold">{activeCampaigns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed Campaigns</span>
              <span className="text-2xl font-bold">{completedCampaigns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</span>
              <span className="text-2xl font-bold">{campaigns?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">Engagement Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Messages Delivered</span>
              <span className="text-2xl font-bold">{analytics.delivered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Messages Read</span>
              <span className="text-2xl font-bold">{analytics.read}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Failed/Bounced</span>
              <span className="text-2xl font-bold">{analytics.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trend (Placeholder) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4">Performance Trend</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Chart visualization will be implemented with chart library
          </p>
        </div>
      </div>
    </div>
  );
}