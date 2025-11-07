import http from '@utils/http';

export const FEEDBACK_QUERY_KEY = ['feedback', 'admin'];
export const FEEDBACK_LIST_QUERY_KEY = [...FEEDBACK_QUERY_KEY, 'list'];
export const FEEDBACK_DETAIL_QUERY_KEY = [...FEEDBACK_QUERY_KEY, 'detail'];

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const feedbackApi = {
  async list(params = {}) {
    const { data } = await http.get('/feedback', {
      params: normalizeParams(params),
    });
    return data;
  },

  async detail(id) {
    const { data } = await http.get(`/feedback/${id}`);
    return data;
  },

  async decide(payload = {}) {
    const { data } = await http.post('/feedback/decision', payload);
    return data;
  },
};

export default feedbackApi;