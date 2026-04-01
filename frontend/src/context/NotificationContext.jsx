import { createContext, useState, useContext, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, saveFCMToken, updateNotificationSettings } from '../services/api';
import { useAuth } from './AuthContext';
import { requestNotificationPermission, onForegroundMessage } from '../utils/firebase';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    messages: true,
    likes: true,
    comments: true,
    follows: true,
    storyReplies: true,
    calls: true
  });
  const [pushEnabled, setPushEnabled] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (notifications.find(n => n._id === id)?.read === false) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await updateNotificationSettings(newSettings);
      if (newSettings.pushEnabled !== undefined) setPushEnabled(newSettings.pushEnabled);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Initialize push notifications
  useEffect(() => {
    const initPushNotifications = async () => {
      if (user && 'Notification' in window) {
        const token = await requestNotificationPermission();
        if (token) {
          await saveFCMToken(token);
        }
        
        // Handle foreground messages
        onForegroundMessage((payload) => {
          const notification = {
            _id: Date.now().toString(),
            type: payload.data?.type || 'message',
            from: { name: payload.notification?.title || 'Someone', avatar: '' },
            text: payload.notification?.body || '',
            read: false,
            createdAt: new Date()
          };
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'New Notification', {
              body: payload.notification?.body || '',
              icon: '/logo192.png'
            });
          }
        });
      }
    };
    
    initPushNotifications();
  }, [user]);

  useEffect(() => {
    if (user && window.socketRef) {
      window.socketRef.on('new_notification', (notification) => {
        console.log('🔔 New notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.from?.name || 'Someone', {
            body: notification.text || getNotificationText(notification),
            icon: notification.from?.avatar || '/logo192.png'
          });
        }
      });

      return () => {
        window.socketRef?.off('new_notification');
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'message': return 'sent you a message';
      case 'story_reply': return 'replied to your story';
      default: return 'sent a notification';
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      settings,
      pushEnabled,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotif,
      updateSettings
    }}>
      {children}
    </NotificationContext.Provider>
  );
};