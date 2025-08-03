import { useState } from 'react';
import { useMessages } from '@/hooks/useCommunication';
import { Message } from '@/types/communication.types';

export function MessageHistory() {
  const [filters, setFilters] = useState({
    channel: '',
    status: '',
    dateRange: 'today'
  });
  
  const { data: messages, isLoading } = useMessages(filters.channel || filters.status ? {
    channel: filters.channel as any || undefined,
    status: filters.status as any || undefined
  } : undefined);

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    read: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    bounced: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    unsubscribed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  };

  const channelIcons = {
    sms: '💬',
    whatsapp: '📱',
    email: '✉️',
    push: '🔔'
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '';
    const d = new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleString();
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
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Message History</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and track all sent messages
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All channels</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      {messages?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No messages found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Messages will appear here once you start sending campaigns
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages?.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-lg">{channelIcons[message.channel]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {message.recipient.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {message.recipient.email || message.recipient.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white truncate max-w-xs">
                        {message.content.subject || message.content.body}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[message.status]}`}>
                        {message.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(message.sentAt || message.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}