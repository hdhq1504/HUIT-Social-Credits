import http from '@utils/http';

export const USERS_QUERY_KEY = ['admin', 'users'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const usersApi = {
  /**
   * Lấy danh sách người dùng (Admin).
   * @param {Object} params - Tham số truy vấn.
   * @returns {Promise<Object>} Danh sách người dùng.
   */
  async list(params = {}) {
    const { data } = await http.get('/users', {
      params: normalizeParams(params),
    });
    return data;
  },

  /**
   * Tạo người dùng mới.
   * @param {Object} payload - Dữ liệu người dùng.
   * @returns {Promise<Object>} Người dùng vừa tạo.
   */
  async create(payload) {
    const { data } = await http.post('/users', payload);
    return data;
  },

  /**
   * Lấy chi tiết người dùng.
   * @param {string|number} id - ID người dùng.
   * @returns {Promise<Object>} Chi tiết người dùng.
   */
  async detail(id) {
    const { data } = await http.get(`/users/${id}`);
    return data;
  },

  /**
   * Cập nhật thông tin người dùng.
   * @param {string|number} id - ID người dùng.
   * @param {Object} payload - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Người dùng đã cập nhật.
   */
  async update(id, payload) {
    const { data } = await http.put(`/users/${id}`, payload);
    return data;
  },

  /**
   * Xóa người dùng.
   * @param {string|number} id - ID người dùng.
   * @returns {Promise<Object>} Kết quả xóa.
   */
  async remove(id) {
    const { data } = await http.delete(`/users/${id}`);
    return data;
  },
};

export default usersApi;
