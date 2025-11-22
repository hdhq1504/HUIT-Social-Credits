import http from '@utils/http';

export const faceProfileApi = {
  /**
   * Lấy thông tin hồ sơ khuôn mặt của tôi.
   * @returns {Promise<Object|null>} Hồ sơ khuôn mặt hoặc null nếu chưa có.
   */
  async get() {
    const { data } = await http.get('/face-profiles/me');
    return data?.profile ?? null;
  },

  /**
   * Tạo hoặc cập nhật hồ sơ khuôn mặt.
   * @param {Object} payload - Dữ liệu khuôn mặt (ảnh, vector đặc trưng...).
   * @returns {Promise<Object|null>} Hồ sơ khuôn mặt đã cập nhật.
   */
  async upsert(payload) {
    const { data } = await http.put('/face-profiles/me', payload);
    return data?.profile ?? null;
  },
};

export default faceProfileApi;
