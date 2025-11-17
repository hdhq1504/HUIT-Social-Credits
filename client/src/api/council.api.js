import http from '@utils/http';

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return acc;
    acc[key] = value;
    return acc;
  }, {});

export const COUNCIL_QUERY_KEYS = {
  base: ['councils'],
  detail: (id) => ['councils', id],
  students: (id, params) => ['councils', id, 'students', params],
  eligibleMembers: (search) => ['councils', 'eligible-members', search],
};

export const councilApi = {
  async list(params = {}) {
    const { data } = await http.get('/councils', { params: normalizeParams(params) });
    return data;
  },
  async create(payload) {
    const { data } = await http.post('/councils', payload);
    return data;
  },
  async detail(id) {
    const { data } = await http.get(`/councils/${id}`);
    return data;
  },
  async update(id, payload) {
    const { data } = await http.put(`/councils/${id}`, payload);
    return data;
  },
  async addMembers(id, payload) {
    const { data } = await http.post(`/councils/${id}/members`, payload);
    return data;
  },
  async removeMember(id, memberId) {
    const { data } = await http.delete(`/councils/${id}/members/${memberId}`);
    return data;
  },
  async searchMembers(search) {
    const { data } = await http.get('/councils/eligible-members', {
      params: normalizeParams({ search }),
    });
    return data.users || [];
  },
  async importStudents(id, payload) {
    const { data } = await http.post(`/councils/${id}/students/import`, payload);
    return data;
  },
  async listStudents(id, params = {}) {
    const { data } = await http.get(`/councils/${id}/students`, {
      params: normalizeParams(params),
    });
    return data;
  },
  async updateStudent(id, evaluationId, payload) {
    const { data } = await http.patch(`/councils/${id}/students/${evaluationId}`, payload);
    return data;
  },
  async finalize(id) {
    const { data } = await http.post(`/councils/${id}/finalize`);
    return data;
  },
  async exportDataset(id) {
    const { data } = await http.get(`/councils/${id}/export-data`);
    return data;
  },
};

export default councilApi;