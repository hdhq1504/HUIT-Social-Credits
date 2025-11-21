import http from '@/utils/http';

export const COUNCIL_QUERY_KEYS = {
  base: ['councils'],
  students: (filters) => [...COUNCIL_QUERY_KEYS.base, 'students', filters],
};

const councilApi = {
  getStudents: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.facultyCode) params.append('facultyCode', filters.facultyCode);
    if (filters.search) params.append('search', filters.search);
    if (filters.namHocId) params.append('namHocId', filters.namHocId);
    if (filters.hocKyId) params.append('hocKyId', filters.hocKyId);

    const response = await http.get(`/councils/students?${params.toString()}`);
    return response.data;
  },

  exportPdf: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.facultyCode) params.append('facultyCode', filters.facultyCode);
    if (filters.search) params.append('search', filters.search);
    if (filters.namHocId) params.append('namHocId', filters.namHocId);
    if (filters.hocKyId) params.append('hocKyId', filters.hocKyId);

    const response = await http.get(`/councils/export/pdf?${params.toString()}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CTXH-${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportExcel: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.facultyCode) params.append('facultyCode', filters.facultyCode);
    if (filters.search) params.append('search', filters.search);
    if (filters.namHocId) params.append('namHocId', filters.namHocId);
    if (filters.hocKyId) params.append('hocKyId', filters.hocKyId);

    const response = await http.get(`/councils/export/excel?${params.toString()}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CTXH-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default councilApi;
