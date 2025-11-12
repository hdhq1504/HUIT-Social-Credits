import http from '@utils/http';

const systemApi = {
  async backup() {
    const { data } = await http.get('/system/backup');
    return data;
  },
  async restore(payload) {
    const { data } = await http.post('/system/restore', payload);
    return data;
  },
};

export default systemApi;
