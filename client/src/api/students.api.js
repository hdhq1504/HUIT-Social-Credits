import http from '@utils/http';

export const STUDENTS_QUERY_KEY = ['admin', 'students'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const studentsApi = {
  async list(params = {}) {
    const { data } = await http.get('/admin/students', {
      params: normalizeParams(params),
    });
    return data;
  },
  async create(payload) {
    const { data } = await http.post('/admin/students', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await http.put(`/admin/students/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await http.delete(`/admin/students/${id}`);
    return data;
  },
  async getClassesByFaculty(facultyId) {
    const { data } = await http.get(`/admin/students/classes/${facultyId}`);
    return data;
  },
  async getFaculties() {
    const { data } = await http.get('/admin/students/faculties');
    return data;
  },
};

export default studentsApi;
