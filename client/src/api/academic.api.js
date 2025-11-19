import http from '@/utils/http';

const academicApi = {
  // Academic years
  async getNamHocs(params) {
    const { data } = await http.get('/academics/admin/namhoc', { params });
    return data;
  },

  async createNamHoc(payload) {
    const { data } = await http.post('/academics/admin/namhoc', payload);
    return data;
  },

  async updateNamHoc(id, payload) {
    const { data } = await http.put(`/academics/admin/namhoc/${id}`, payload);
    return data;
  },

  async deleteNamHoc(id) {
    const { data } = await http.delete(`/academics/admin/namhoc/${id}`);
    return data;
  },

  async activateNamHoc(id) {
    const { data } = await http.put(`/academics/admin/namhoc/${id}/activate`);
    return data;
  },

  // Semesters
  async getHocKys(namHocId) {
    const { data } = await http.get(`/academics/admin/namhoc/${namHocId}/hocky`);
    return data;
  },

  async createHocKy(namHocId, payload) {
    const { data } = await http.post(`/academics/admin/namhoc/${namHocId}/hocky`, payload);
    return data;
  },

  async updateHocKy(id, payload) {
    const { data } = await http.put(`/academics/admin/hocky/${id}`, payload);
    return data;
  },

  async deleteHocKy(id) {
    const { data } = await http.delete(`/academics/admin/hocky/${id}`);
    return data;
  },
};

export default academicApi;
