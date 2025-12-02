import http from '@/utils/http';

export const TEACHER_QUERY_KEYS = {
  CLASSES: ['teacher', 'classes'],
};

const teacherApi = {
  /**
   * Lấy danh sách lớp học phần của giảng viên.
   * @returns {Promise<Array>} Danh sách lớp học phần.
   */
  async getClasses() {
    const { data } = await http.get('/teacher/classes');
    return data;
  },

  /**
   * Lấy chi tiết lớp học phần.
   * @param {string|number} classId - ID lớp học phần.
   * @returns {Promise<Object>} Chi tiết lớp học phần.
   */
  async getClassDetail(classId) {
    const { data } = await http.get(`/teacher/classes/${classId}`);
    return data;
  },

  /**
   * Lấy danh sách sinh viên trong lớp học phần.
   * @param {string|number} classId - ID lớp học phần.
   * @param {string|number} [hocKyId] - ID học kỳ (tùy chọn).
   * @returns {Promise<Array>} Danh sách sinh viên.
   */
  async getClassStudents(classId, hocKyId) {
    const params = hocKyId ? { hocKyId } : undefined;
    const { data } = await http.get(`/teacher/classes/${classId}/students`, { params });
    return data;
  },

  /**
   * Lấy điểm rèn luyện của sinh viên trong lớp.
   * @param {string|number} classId - ID lớp học phần.
   * @param {string|number} studentId - ID sinh viên.
   * @param {string|number} [hocKyId] - ID học kỳ (tùy chọn).
   * @returns {Promise<Object>} Thông tin điểm rèn luyện.
   */
  async getStudentPoints(classId, studentId, hocKyId) {
    const params = hocKyId ? { hocKyId } : undefined;
    const { data } = await http.get(`/teacher/classes/${classId}/students/${studentId}`, { params });
    return data;
  },

  /**
   * Xuất báo cáo lớp học phần.
   * @param {string|number} classId - ID lớp học phần.
   * @param {Object} options - Tùy chọn xuất (hocKyId, format).
   * @returns {Promise<Blob|Object>} File báo cáo hoặc dữ liệu JSON.
   */
  async exportClassReport(classId, { hocKyId, format = 'json' } = {}) {
    const params = { format };
    if (hocKyId) params.hocKyId = hocKyId;
    const response = await http.get(`/teacher/classes/${classId}/export`, {
      params,
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  // Homeroom methods
  /**
   * Lấy danh sách lớp chủ nhiệm của giảng viên.
   * @returns {Promise<Array>} Danh sách lớp chủ nhiệm.
   */
  async getMyClasses() {
    const { data } = await http.get('/teacher/homeroom/my-classes');
    return data;
  },

  /**
   * Lấy danh sách sinh viên trong lớp chủ nhiệm.
   * @param {string|number} classId - ID lớp chủ nhiệm.
   * @returns {Promise<Array>} Danh sách sinh viên.
   */
  async getHomeroomClassStudents(classId) {
    const { data } = await http.get(`/teacher/homeroom/classes/${classId}/students`);
    return data;
  },

  /**
   * Lấy bảng điểm của sinh viên (Lớp chủ nhiệm).
   * @param {string|number} studentId - ID sinh viên.
   * @returns {Promise<Object>} Bảng điểm sinh viên.
   */
  async getStudentScores(studentId) {
    const { data } = await http.get(`/teacher/homeroom/students/${studentId}/scores`);
    return data;
  },

  /**
   * Xuất danh sách điểm của lớp chủ nhiệm.
   * @param {string|number} classId - ID lớp chủ nhiệm.
   * @returns {Promise<Blob>} File Excel.
   */
  async exportHomeroomClassScores(classId) {
    const response = await http.get(`/teacher/homeroom/classes/${classId}/export-scores`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default teacherApi;
