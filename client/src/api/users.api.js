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
};

export default usersApi;
