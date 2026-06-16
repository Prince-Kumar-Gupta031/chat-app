import { create } from 'zustand';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationIds: string[] | 'all') => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unread = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount: unread });
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  markAsRead: (notificationIds) => set((state) => {
    if (notificationIds === 'all') {
      const updatedNotifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      return {
        notifications: updatedNotifications,
        unreadCount: 0,
      };
    }

    const updatedNotifications = state.notifications.map((n) =>
      notificationIds.includes(n.id) ? { ...n, isRead: true } : n
    );

    const unread = updatedNotifications.filter((n) => !n.isRead).length;

    return {
      notifications: updatedNotifications,
      unreadCount: unread,
    };
  }),
}));