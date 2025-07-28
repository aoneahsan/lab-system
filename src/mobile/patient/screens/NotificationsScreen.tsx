import React, { useState } from 'react';
import {
  Bell,
  FileText,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Pill,
  Heart,
  TrendingUp,
  Settings,
  X,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'result' | 'appointment' | 'reminder' | 'health_tip' | 'critical' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}

interface NotificationsScreenProps {
  onRead?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Critical Test Result',
      message: 'Your Cholesterol levels require immediate attention. Please contact your doctor.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      priority: 'high',
      icon: AlertCircle,
      color: 'red',
      actionUrl: '/patient/results/2',
    },
    {
      id: '2',
      type: 'result',
      title: 'Test Results Ready',
      message: 'Your Complete Blood Count test results are now available for viewing.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: false,
      priority: 'medium',
      icon: FileText,
      color: 'green',
      actionUrl: '/patient/results/1',
    },
    {
      id: '3',
      type: 'appointment',
      title: 'Appointment Tomorrow',
      message:
        'Blood test collection scheduled for tomorrow at 9:00 AM. Remember to fast for 12 hours.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
      priority: 'high',
      icon: Calendar,
      color: 'blue',
      actionUrl: '/patient/appointments/1',
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Medication Reminder',
      message: 'Time to take your prescribed medication: Metformin 500mg',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
      priority: 'medium',
      icon: Pill,
      color: 'purple',
    },
    {
      id: '5',
      type: 'health_tip',
      title: 'Health Tip of the Day',
      message:
        'Stay hydrated! Drinking 8 glasses of water daily helps maintain healthy kidney function.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      read: true,
      priority: 'low',
      icon: Heart,
      color: 'pink',
    },
    {
      id: '6',
      type: 'system',
      title: 'App Update Available',
      message: 'A new version of LabFlow is available with improved features and bug fixes.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
      priority: 'low',
      icon: Info,
      color: 'gray',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const notificationTypes = [
    { id: 'result', label: 'Results', icon: FileText },
    { id: 'appointment', label: 'Appointments', icon: Calendar },
    { id: 'reminder', label: 'Reminders', icon: Clock },
    { id: 'critical', label: 'Critical', icon: AlertCircle },
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.read) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(notif.type)) return false;
    return true;
  });

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    onRead?.();
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
  };

  const toggleTypeFilter = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const getNotificationIcon = (notification: Notification) => {
    const Icon = notification.icon || Bell;
    const colorClass = {
      red: 'text-red-500 bg-red-50',
      green: 'text-green-500 bg-green-50',
      blue: 'text-blue-500 bg-blue-50',
      purple: 'text-purple-500 bg-purple-50',
      pink: 'text-pink-500 bg-pink-50',
      gray: 'text-gray-500 bg-gray-50',
    }[notification.color || 'gray'];

    return (
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-sm text-indigo-600 font-medium">
                  Mark all read
                </button>
              )}
              <button className="p-2">
                <Settings className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Read/Unread Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Unread
              </button>
            </div>

            {/* Type Filters */}
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {notificationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleTypeFilter(type.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedTypes.includes(type.id)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <type.icon className="h-3 w-3" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                !notification.read ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p
                          className={`font-medium text-gray-900 ${
                            !notification.read ? 'font-semibold' : ''
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mt-2 text-xs text-indigo-600 font-medium flex items-center space-x-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Mark as read</span>
                      </button>
                    )}

                    {notification.actionUrl && (
                      <button className="mt-2 text-sm text-indigo-600 font-medium">
                        View Details →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
