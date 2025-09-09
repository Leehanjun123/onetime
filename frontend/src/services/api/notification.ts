import api from './auth';

export const notificationAPI = {
  getNotifications: async () => {
    return api.get('/notifications');
  },

  markAsRead: async (notificationId: string) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`);
  },

  getPreferences: async () => {
    return api.get('/notifications/preferences');
  },

  updatePreferences: async (preferences: any) => {
    return api.put('/notifications/preferences', preferences);
  },
};