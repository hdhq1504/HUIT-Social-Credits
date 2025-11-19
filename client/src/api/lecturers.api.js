import http from '@utils/http';

export const LECTURERS_QUERY_KEY = ['admin', 'lecturers'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const lecturersApi = {
  async list(params = {}) {
    const { data } = await http.get('/admin/teachers', {
      params: normalizeParams(params),
    });
    return data;
  },
  async assignHomeroom(payload) {
    const { data } = await http.post('/admin/teachers/assign-homeroom', payload);
    return data;
  },
  async getAvailableClasses() {
    const { data } = await http.get('/admin/teachers/classes/available');
    return data;
  },
};

export default lecturersApi;
