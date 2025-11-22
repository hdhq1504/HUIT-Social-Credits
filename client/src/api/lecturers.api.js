import http from '@utils/http';

export const LECTURERS_QUERY_KEY = ['admin', 'lecturers'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const lecturersApi = {
  /**
   * Lấy danh sách giảng viên (Admin).
   * @param {Object} params - Tham số truy vấn.
   * @returns {Promise<Object>} Danh sách giảng viên.
   */
  async list(params = {}) {
    const { data } = await http.get('/admin/teachers', {
      params: normalizeParams(params),
    });
    return data;
  },

  /**
   * Phân công lớp chủ nhiệm cho giảng viên.
   * @param {Object} payload - Dữ liệu phân công (teacherId, classId...).
   * @returns {Promise<Object>} Kết quả phân công.
   */
  async assignHomeroom(payload) {
    const { data } = await http.post('/admin/teachers/assign-homeroom', payload);
    return data;
  },

  /**
   * Lấy danh sách lớp chưa có chủ nhiệm (để phân công).
   * @returns {Promise<Array>} Danh sách lớp.
   */
  async getAvailableClasses() {
    const { data } = await http.get('/admin/teachers/classes/available');
    return data;
  },

  /**
   * Xóa giảng viên (Xóa tài khoản người dùng).
   * @param {string|number} id - ID giảng viên.
   * @returns {Promise<Object>} Kết quả xóa.
   */
  async remove(id) {
    const { data } = await http.delete(`/users/${id}`);
    return data;
  },
};

export default lecturersApi;
