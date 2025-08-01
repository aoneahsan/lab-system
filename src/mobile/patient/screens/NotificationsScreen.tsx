import React, { useState } from 'react';
import { Bell, FileText, Calendar, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'result' | 'appointment' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const NotificationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'result',
      title: 'Test Results Ready',
      message: 'Your Complete Blood Count test results are now available',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionUrl: '/patient/results/1',
    },
    {
      id: '2',
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'Blood test collection tomorrow at 9:00 AM at Main Lab',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      actionUrl: '/patient/appointments/1',
    },
    {
      id: '3',
      type: 'critical',
      title: 'Critical Result Alert',
      message: 'Your physician has been notified about your recent test results',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
      actionUrl: '/patient/results/2',
    },
    {
      id: '4',
      type: 'info',
      title: 'Health Tip',
      message: 'Remember to fast for 12 hours before your lipid panel test',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      read: true,
    },
  ]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'result':
        return FileText;
      case 'appointment':
        return Calendar;
      case 'critical':
        return AlertCircle;
      case 'info':
        return Info;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'result':
        return 'text-green-600 bg-green-100';
      case 'appointment':
        return 'text-blue-600 bg-blue-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate if action URL exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-indigo-600 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-4 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer ${
                  !notification.read ? 'border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getIconColor(notification.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="ml-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              You'll receive notifications about your tests and appointments here
            </p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="p-4">
        <button
          onClick={() => navigate('/patient/profile/notifications')}
          className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Notification Settings</span>
          <span className="text-gray-400">›</span>
        </button>
      </div>
    </div>
  );
};