import http from '@utils/http';

export const USERS_QUERY_KEY = ['admin', 'users'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const usersApi = {
  async list(params = {}) {
    const { data } = await http.get('/users', {
      params: normalizeParams(params),
    });
    return data;
  },
  async create(payload) {
    const { data } = await http.post('/users', payload);
    return data;
  },
  async detail(id) {
    const { data } = await http.get(`/users/${id}`);
    return data;
  },
  async update(id, payload) {
    const { data } = await http.put(`/users/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await http.delete(`/users/${id}`);
    return data;
  },
};

export default usersApi;
