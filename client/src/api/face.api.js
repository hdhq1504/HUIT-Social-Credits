import http from '@utils/http';

export const faceApi = {
  async status() {
    const { data } = await http.get('/face/profile');
    return data;
  },
  async register(payload) {
    const { data } = await http.post('/face/register', payload);
    return data;
  },
};

export default faceApi;