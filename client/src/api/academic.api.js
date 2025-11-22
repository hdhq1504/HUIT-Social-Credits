import http from '@/utils/http';

const academicApi = {
  /**
   * Lấy danh sách năm học.
   * @param {Object} params - Tham số truy vấn (page, limit, search...).
   * @returns {Promise<Object>} Dữ liệu danh sách năm học.
   */
  async getNamHocs(params) {
    const { data } = await http.get('/academics/admin/namhoc', { params });
    return data;
  },

  /**
   * Tạo năm học mới.
   * @param {Object} payload - Dữ liệu năm học mới.
   * @returns {Promise<Object>} Năm học vừa tạo.
   */
  async createNamHoc(payload) {
    const { data } = await http.post('/academics/admin/namhoc', payload);
    return data;
  },

  /**
   * Cập nhật thông tin năm học.
   * @param {string|number} id - ID năm học.
   * @param {Object} payload - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Năm học đã cập nhật.
   */
  async updateNamHoc(id, payload) {
    const { data } = await http.put(`/academics/admin/namhoc/${id}`, payload);
    return data;
  },

  /**
   * Xóa năm học.
   * @param {string|number} id - ID năm học.
   * @returns {Promise<Object>} Kết quả xóa.
   */
  async deleteNamHoc(id) {
    const { data } = await http.delete(`/academics/admin/namhoc/${id}`);
    return data;
  },

  /**
   * Kích hoạt năm học (đặt làm năm học hiện tại).
   * @param {string|number} id - ID năm học.
   * @returns {Promise<Object>} Kết quả kích hoạt.
   */
  async activateNamHoc(id) {
    const { data } = await http.put(`/academics/admin/namhoc/${id}/activate`);
    return data;
  },

  /**
   * Lấy danh sách học kỳ của một năm học.
   * @param {string|number} namHocId - ID năm học.
   * @returns {Promise<Object>} Danh sách học kỳ.
   */
  async getHocKys(namHocId) {
    const { data } = await http.get(`/academics/admin/namhoc/${namHocId}/hocky`);
    return data;
  },

  /**
   * Tạo học kỳ mới cho năm học.
   * @param {string|number} namHocId - ID năm học.
   * @param {Object} payload - Dữ liệu học kỳ.
   * @returns {Promise<Object>} Học kỳ vừa tạo.
   */
  async createHocKy(namHocId, payload) {
    const { data } = await http.post(`/academics/admin/namhoc/${namHocId}/hocky`, payload);
    return data;
  },

  /**
   * Cập nhật thông tin học kỳ.
   * @param {string|number} id - ID học kỳ.
   * @param {Object} payload - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Học kỳ đã cập nhật.
   */
  async updateHocKy(id, payload) {
    const { data } = await http.put(`/academics/admin/hocky/${id}`, payload);
    return data;
  },

  /**
   * Xóa học kỳ.
   * @param {string|number} id - ID học kỳ.
   * @returns {Promise<Object>} Kết quả xóa.
   */
  async deleteHocKy(id) {
    const { data } = await http.delete(`/academics/admin/hocky/${id}`);
    return data;
  },
};

export default academicApi;
