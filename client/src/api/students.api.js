import http from '@utils/http';

export const STUDENTS_QUERY_KEY = ['admin', 'students'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const studentsApi = {
  /**
   * Lấy danh sách sinh viên (Admin).
   * @param {Object} params - Tham số truy vấn.
   * @returns {Promise<Object>} Danh sách sinh viên.
   */
  async list(params = {}) {
    const { data } = await http.get('/admin/students', {
      params: normalizeParams(params),
    });
    return data;
  },

  /**
   * Tạo sinh viên mới.
   * @param {Object} payload - Dữ liệu sinh viên.
   * @returns {Promise<Object>} Sinh viên vừa tạo.
   */
  async create(payload) {
    const { data } = await http.post('/admin/students', payload);
    return data;
  },

  /**
   * Cập nhật thông tin sinh viên.
   * @param {string|number} id - ID sinh viên.
   * @param {Object} payload - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Sinh viên đã cập nhật.
   */
  async update(id, payload) {
    const { data } = await http.put(`/admin/students/${id}`, payload);
    return data;
  },

  /**
   * Xóa sinh viên.
   * @param {string|number} id - ID sinh viên.
   * @returns {Promise<Object>} Kết quả xóa.
   */
  async remove(id) {
    const { data } = await http.delete(`/admin/students/${id}`);
    return data;
  },

  /**
   * Lấy danh sách lớp theo khoa.
   * @param {string|number} facultyId - ID khoa.
   * @returns {Promise<Array>} Danh sách lớp.
   */
  async getClassesByFaculty(facultyId) {
    const { data } = await http.get(`/admin/students/classes/${facultyId}`);
    return data;
  },

  /**
   * Lấy danh sách khoa.
   * @returns {Promise<Array>} Danh sách khoa.
   */
  async getFaculties() {
    const { data } = await http.get('/admin/students/faculties');
    return data;
  },

  /**
   * Lấy danh sách ngành theo khoa.
   * @param {string|number} facultyId - ID khoa.
   * @returns {Promise<Array>} Danh sách ngành.
   */
  async getMajorsByFaculty(facultyId) {
    const { data } = await http.get(`/admin/students/faculties/${facultyId}/majors`);
    return data;
  },

  /**
   * Lấy danh sách lớp theo ngành.
   * @param {string|number} majorId - ID ngành.
   * @returns {Promise<Array>} Danh sách lớp.
   */
  async getClassesByMajor(majorId) {
    const { data } = await http.get(`/admin/students/majors/${majorId}/classes`);
    return data;
  },
};

export default studentsApi;
