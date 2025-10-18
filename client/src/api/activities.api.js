import http from '@utils/http';

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
};

export default activitiesApi;
