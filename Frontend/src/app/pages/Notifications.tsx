import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/ui/utils';
import { api } from '../../services/api';

interface Notification {
  id: string;
  message: string;
  read_status: boolean;
  created_at: string;
}

const getNotificationIcon = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('resolv') || lower.includes('complet')) {
    return <CheckCircle className="w-5 h-5 text-accent" />;
  }
  if (lower.includes('meeting') || lower.includes('announc')) {
    return <Bell className="w-5 h-5 text-primary" />;
  }
  if (lower.includes('reply') || lower.includes('comment')) {
    return <MessageSquare className="w-5 h-5 text-primary" />;
  }
  if (lower.includes('due') || lower.includes('remind')) {
    return <Clock className="w-5 h-5 text-warning" />;
  }
  return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
};

const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Notification[]>('/api/notifications/');
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
      ? notifications.filter((n) => !n.read_status)
      : notifications.filter((n) => n.read_status);

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read/`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
      );
    } catch {
      // silently fail — user can retry
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read_status);
    try {
      await Promise.all(unread.map((n) => api.patch(`/api/notifications/${n.id}/read/`, {})));
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    } catch {
      // silently fail
    }
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

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto opacity-70" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchNotifications}>
                Retry
              </Button>
            </div>
          )}

          {/* Notifications List */}
          {!loading && !error && (
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
                      !notification.read_status
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 mt-1">
                        {getNotificationIcon(notification.message)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-card-foreground">
                            {notification.message}
                          </h3>
                          {!notification.read_status && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.created_at)}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read_status && (
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
                    {activeTab === 'all'
                      ? 'No notifications yet'
                      : `No ${activeTab} notifications`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
