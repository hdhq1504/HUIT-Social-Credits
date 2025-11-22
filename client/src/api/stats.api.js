import http from '@utils/http';

export const PROGRESS_QUERY_KEY = ['stats', 'progress'];
export const CATEGORY_QUERY_KEY = ['stats', 'categories'];
export const ADMIN_DASHBOARD_QUERY_KEY = ['dashboard', 'admin'];
export const ADMIN_REPORTS_QUERY_KEY = ['reports', 'admin'];

export const statsApi = {
  /**
   * Lấy tiến độ điểm rèn luyện của sinh viên.
   * @returns {Promise<Object>} Thông tin tiến độ.
   */
  async getProgress() {
    const { data } = await http.get('/stats/progress');
    return data.progress;
  },

  /**
   * Lấy thống kê theo danh mục hoạt động.
   * @returns {Promise<Array>} Danh sách thống kê danh mục.
   */
  async getCategories() {
    const { data } = await http.get('/stats/categories');
    return data.categories ?? [];
  },

  /**
   * Lấy dữ liệu tổng quan cho Dashboard Admin.
   * @returns {Promise<Object>} Dữ liệu dashboard.
   */
  async getAdminDashboard() {
    const { data } = await http.get('/stats/admin/dashboard');
    return data;
  },

  /**
   * Lấy báo cáo thống kê cho Admin.
   * @param {Object} params - Tham số truy vấn báo cáo.
   * @returns {Promise<Object>} Dữ liệu báo cáo.
   */
  async getAdminReports(params = {}) {
    const { data } = await http.get('/stats/admin/reports', { params });
    return data;
  },
};

export default statsApi;
