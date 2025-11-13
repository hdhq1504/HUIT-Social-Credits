import http from '@utils/http';

export const CLASS_QUERY_KEY = ['classes'];
export const CLASS_FILTERS_QUERY_KEY = [...CLASS_QUERY_KEY, 'filters'];
export const MY_CLASSES_QUERY_KEY = [...CLASS_QUERY_KEY, 'mine'];

const normalizeResponse = (data) => data ?? {};

const classesApi = {
  async listMine() {
    const { data } = await http.get('/classes/mine');
    return normalizeResponse(data);
  },

  async getFilters() {
    const { data } = await http.get('/classes/filters');
    return normalizeResponse(data);
  },
};

export default classesApi;
