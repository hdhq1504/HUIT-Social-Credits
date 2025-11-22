import http from '@utils/http';

export const ADMIN_REGISTRATIONS_QUERY_KEY = ['admin', 'registrations'];
export const ADMIN_REGISTRATION_DETAIL_QUERY_KEY = [...ADMIN_REGISTRATIONS_QUERY_KEY, 'detail'];
export const ADMIN_REGISTRATION_ACTIVITY_QUERY_KEY = [...ADMIN_REGISTRATIONS_QUERY_KEY, 'activity'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || Number.isNaN(value)) return acc;
    acc[key] = value;
    return acc;
  }, {});

const registrationsApi = {
  /**
   * Lấy danh sách đăng ký (Admin).
   * @param {Object} params - Tham số truy vấn.
   * @returns {Promise<Object>} Danh sách đăng ký.
   */
  async list(params = {}) {
    const { data } = await http.get('/registrations', { params: normalizeParams(params) });
    return data;
  },

  /**
   * Lấy chi tiết đăng ký.
   * @param {string|number} id - ID đăng ký.
   * @returns {Promise<Object>} Chi tiết đăng ký.
   */
  async detail(id) {
    const { data } = await http.get(`/registrations/${id}`);
    return data;
  },

  /**
   * Xử lý đăng ký (Duyệt/Từ chối).
   * @param {string|number} id - ID đăng ký.
   * @param {Object} payload - Dữ liệu xử lý.
   * @returns {Promise<Object>} Kết quả xử lý.
   */
  async decide(id, payload = {}) {
    const { data } = await http.post(`/registrations/${id}/decision`, payload);
    return data;
  },

  /**
   * Lấy danh sách đăng ký theo hoạt động.
   * @param {string|number} activityId - ID hoạt động.
   * @param {Object} params - Tham số truy vấn.
   * @returns {Promise<Object>} Danh sách đăng ký của hoạt động.
   */
  async listByActivity(activityId, params = {}) {
    const { data } = await http.get(`/activities/${activityId}/registrations`, {
      params: normalizeParams(params),
    });
    return data;
  },
};

export default registrationsApi;
