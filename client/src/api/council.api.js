import http from '@/utils/http';

export const COUNCIL_QUERY_KEYS = {
  base: ['councils'],
  students: (filters) => [...COUNCIL_QUERY_KEYS.base, 'students', filters],
};

const councilApi = {
  /**
   * Lấy danh sách sinh viên thuộc hội đồng (theo bộ lọc).
   * @param {Object} filters - Các bộ lọc (facultyCode, search, namHocId, hocKyId).
   * @returns {Promise<Object>} Danh sách sinh viên và thông tin phân trang.
   */
  getStudents: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.facultyCode) params.append('facultyCode', filters.facultyCode);
    if (filters.search) params.append('search', filters.search);
    if (filters.namHocId) params.append('namHocId', filters.namHocId);
    if (filters.hocKyId) params.append('hocKyId', filters.hocKyId);

    const response = await http.get(`/councils/students?${params.toString()}`);
    return response.data;
  },

  /**
   * Xuất danh sách sinh viên ra file PDF.
   * @param {Object} filters - Các bộ lọc để xuất dữ liệu.
   * @returns {Promise<void>} Tải xuống file PDF.
   */
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

  /**
   * Xuất danh sách sinh viên ra file Excel.
   * @param {Object} filters - Các bộ lọc để xuất dữ liệu.
   * @returns {Promise<void>} Tải xuống file Excel.
   */
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
