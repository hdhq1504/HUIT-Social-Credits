import http from '@utils/http';

export const ACTIVITIES_QUERY_KEY = ['activities'];
export const MY_ACTIVITIES_QUERY_KEY = [...ACTIVITIES_QUERY_KEY, 'mine'];

export const activitiesApi = {
  async list() {
    const { data } = await http.get('/activities');
    return data.activities ?? [];
  },
  async detail(id) {
    const { data } = await http.get(`/activities/${id}`);
    return data.activity;
  },
  async register(activityId, payload = {}) {
    const { data } = await http.post(`/activities/${activityId}/registrations`, payload);
    return data.activity;
  },
  async cancel(activityId, payload = {}) {
    const { data } = await http.post(`/activities/${activityId}/registrations/cancel`, payload);
    return data.activity;
  },
  async attendance(activityId, payload = {}) {
    const { data } = await http.post(`/activities/${activityId}/attendance`, payload);
    return data;
  },
  async feedback(activityId, payload = {}) {
    const { data } = await http.post(`/activities/${activityId}/feedback`, payload);
    return data;
  },
  async listMine(params = {}) {
    const { data } = await http.get('/activities/my', { params });
    return data.registrations ?? [];
  },
};

export default activitiesApi;
