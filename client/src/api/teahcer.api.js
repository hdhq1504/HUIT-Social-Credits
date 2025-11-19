import http from "@/utils/http.js";

/**
 * Lấy danh sách các lớp giảng viên đang chủ nhiệm
 */
export const getMyClasses = () => {
  return http.get("/teacher/classes");
};

/**
 * Lấy chi tiết một lớp
 */
export const getClassDetail = (classId) => {
  return http.get(`/teacher/classes/${classId}`);
};

/**
 * Lấy danh sách sinh viên trong lớp với điểm
 */
export const getClassStudents = (classId, hocKyId = null) => {
  const params = hocKyId ? { hocKyId } : {};
  return http.get(`/teacher/classes/${classId}/students`, { params });
};

/**
 * Lấy chi tiết điểm của một sinh viên
 */
export const getStudentPoints = (classId, studentId, hocKyId = null) => {
  const params = hocKyId ? { hocKyId } : {};
  return http.get(`/teacher/classes/${classId}/students/${studentId}`, { params });
};

/**
 * Xuất báo cáo điểm lớp
 */
export const exportClassReport = (classId, hocKyId = null, format = "json") => {
  const params = { format };
  if (hocKyId) params.hocKyId = hocKyId;

  if (format === "csv") {
    return http.get(`/teacher/classes/${classId}/export`, {
      params,
      responseType: "blob",
    });
  }

  return http.get(`/teacher/classes/${classId}/export`, { params });
};