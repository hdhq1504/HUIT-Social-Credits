import http from '@utils/http';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = [...NOTIFICATIONS_QUERY_KEY, 'unread-count'];

export const notificationsApi = {
  async list(params = {}) {
    const { data } = await http.get('/notifications', { params });
    return data.notifications ?? [];
  },
  async getUnreadCount() {
    const { data } = await http.get('/notifications/unread-count');
    return data ?? { count: 0 };
  },
  async markAllRead() {
    const { data } = await http.post('/notifications/mark-all-read');
    return data;
  },
};

export default notificationsApi;
