import React, { useState } from 'react';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/ui/utils';

interface Notification {
  id: string;
  type: 'complaint' | 'announcement' | 'update' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon?: React.ReactNode;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'update',
    title: 'Complaint Resolved',
    message: 'Your complaint about water supply has been resolved.',
    timestamp: '10 minutes ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'announcement',
    title: 'Society Meeting',
    message: 'Monthly society meeting scheduled for this Saturday at 5 PM.',
    timestamp: '1 hour ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'complaint',
    title: 'New Reply',
    message: 'Admin replied to your security gate complaint.',
    timestamp: '2 hours ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'update',
    title: 'Status Update',
    message: 'Your maintenance request is now in progress.',
    timestamp: '5 hours ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Maintenance Fee Due',
    message: 'Monthly maintenance fee payment is due by April 15, 2026.',
    timestamp: '1 day ago',
    isRead: false,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'update':
      return <CheckCircle className="w-5 h-5 text-accent" />;
    case 'announcement':
      return <Bell className="w-5 h-5 text-primary" />;
    case 'complaint':
      return <MessageSquare className="w-5 h-5 text-primary" />;
    case 'reminder':
      return <Clock className="w-5 h-5 text-warning" />;
    default:
      return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications.filter((n) => n.isRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Notifications" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Notifications</h2>
              <p className="text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="hidden md:flex"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="all">
                All{' '}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({notifications.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread{' '}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({unreadCount})
                </span>
              </TabsTrigger>
              <TabsTrigger value="read">
                Read{' '}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({notifications.length - unreadCount})
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={cn(
                    'bg-card border rounded-xl p-4 transition-all hover:shadow-md group',
                    !notification.isRead
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-card-foreground">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 text-xs"
                            >
                              <CheckCheck className="w-3 h-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No notifications in this category
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
