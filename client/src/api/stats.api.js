import http from '@utils/http';

export const PROGRESS_QUERY_KEY = ['stats', 'progress'];
export const CATEGORY_QUERY_KEY = ['stats', 'categories'];

export const statsApi = {
  async getProgress() {
    const { data } = await http.get('/stats/progress');
    return data.progress;
  },
  async getCategories() {
    const { data } = await http.get('/stats/categories');
    return data.categories ?? [];
  },
};

export default statsApi;
