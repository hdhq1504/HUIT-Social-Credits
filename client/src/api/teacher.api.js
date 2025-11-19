import http from '@/utils/http';

export const TEACHER_QUERY_KEYS = {
  CLASSES: ['teacher', 'classes'],
};

const teacherApi = {
  async getClasses() {
    const { data } = await http.get('/teacher/classes');
    return data;
  },
  async getClassDetail(classId) {
    const { data } = await http.get(`/teacher/classes/${classId}`);
    return data;
  },
  async getClassStudents(classId, hocKyId) {
    const params = hocKyId ? { hocKyId } : undefined;
    const { data } = await http.get(`/teacher/classes/${classId}/students`, { params });
    return data;
  },
  async getStudentPoints(classId, studentId, hocKyId) {
    const params = hocKyId ? { hocKyId } : undefined;
    const { data } = await http.get(`/teacher/classes/${classId}/students/${studentId}`, { params });
    return data;
  },
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
  async getMyClasses() {
    const { data } = await http.get('/teacher/homeroom/my-classes');
    return data;
  },

  async getHomeroomClassStudents(classId) {
    const { data } = await http.get(`/teacher/homeroom/classes/${classId}/students`);
    return data;
  },

  async getStudentScores(studentId) {
    const { data } = await http.get(`/teacher/homeroom/students/${studentId}/scores`);
    return data;
  },
};

export default teacherApi;