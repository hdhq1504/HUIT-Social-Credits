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
  async list(params = {}) {
    const { data } = await http.get('/registrations', { params: normalizeParams(params) });
    return data;
  },

  async detail(id) {
    const { data } = await http.get(`/registrations/${id}`);
    return data;
  },

  async decide(id, payload = {}) {
    const { data } = await http.post(`/registrations/${id}/decision`, payload);
    return data;
  },

  async listByActivity(activityId, params = {}) {
    const { data } = await http.get(`/activities/${activityId}/registrations`, {
      params: normalizeParams(params),
    });
    return data;
  },
};

export default registrationsApi;
