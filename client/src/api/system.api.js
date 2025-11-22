import http from '@utils/http';

const systemApi = {
  /**
   * Sao lưu dữ liệu hệ thống.
   * @returns {Promise<Object>} Kết quả sao lưu.
   */
  async backup() {
    const { data } = await http.get('/system/backup');
    return data;
  },

  /**
   * Khôi phục dữ liệu hệ thống.
   * @param {Object} payload - Dữ liệu khôi phục (file backup...).
   * @returns {Promise<Object>} Kết quả khôi phục.
   */
  async restore(payload) {
    const { data } = await http.post('/system/restore', payload);
    return data;
  },
};

export default systemApi;
