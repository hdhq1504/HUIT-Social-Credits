import http from '@utils/http';

export const faceProfileApi = {
  async get(options = {}) {
    const params = {};
    if (options.includeDescriptors) {
      params.include = 'descriptors';
    }
    const { data } = await http.get('/face-profiles/me', { params });
    return data?.profile ?? null;
  },
  async upsert(payload) {
    const { data } = await http.put('/face-profiles/me', payload);
    return data?.profile ?? null;
  },
};

export default faceProfileApi;
