import http from '@utils/http';

export const PROGRESS_QUERY_KEY = ['stats', 'progress'];
export const CATEGORY_QUERY_KEY = ['stats', 'categories'];
export const ADMIN_DASHBOARD_QUERY_KEY = ['dashboard', 'admin'];
export const ADMIN_REPORTS_QUERY_KEY = ['reports', 'admin'];

export const statsApi = {
  async getProgress() {
    const { data } = await http.get('/stats/progress');
    return data.progress;
  },
  async getCategories() {
    const { data } = await http.get('/stats/categories');
    return data.categories ?? [];
  },
  async getAdminDashboard() {
    const { data } = await http.get('/stats/admin/dashboard');
    return data;
  },
  async getAdminReports(params = {}) {
    const { data } = await http.get('/stats/admin/reports', { params });
    return data;
  },
};

export default statsApi;
