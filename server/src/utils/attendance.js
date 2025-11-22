const ATTENDANCE_METHOD_MAP = {
  QR: "qr",
  PHOTO: "photo"
};

const LABEL_MAP = {
  qr: "QR Code",
  photo: "Chụp Ảnh"
};

/**
 * Chuẩn hóa giá trị phương thức điểm danh.
 * @param {string} value - Giá trị đầu vào.
 * @returns {string|null} Giá trị chuẩn hóa (QR, PHOTO) hoặc null.
 */
export const normalizeAttendanceMethod = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "face") {
    return "PHOTO";
  }
  const entry = Object.entries(ATTENDANCE_METHOD_MAP).find(([, apiValue]) => apiValue === normalized);
  if (entry) {
    return entry[0];
  }
  const key = normalized.toUpperCase();
  return ATTENDANCE_METHOD_MAP[key] ? key : null;
};

/**
 * Map phương thức điểm danh sang giá trị API (lowercase).
 * @param {string} value - Giá trị phương thức điểm danh.
 * @returns {string|null} Giá trị API hoặc null.
 */
export const mapAttendanceMethodToApi = (value) => {
  if (!value) return null;
  if (String(value).trim().toLowerCase() === "face") {
    return "photo";
  }
  if (ATTENDANCE_METHOD_MAP[value]) {
    return ATTENDANCE_METHOD_MAP[value];
  }
  const normalized = String(value).trim().toLowerCase();
  const entry = Object.entries(ATTENDANCE_METHOD_MAP).find(([, apiValue]) => apiValue === normalized);
  return entry ? entry[1] : null;
};

/**
 * Lấy nhãn hiển thị cho phương thức điểm danh.
 * @param {string} value - Giá trị phương thức điểm danh.
 * @returns {string|null} Nhãn hiển thị hoặc null.
 */
export const getAttendanceMethodLabel = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return LABEL_MAP[normalized] ?? null;
};

/**
 * Lấy phương thức điểm danh mặc định.
 * @returns {string} "QR".
 */
export const getDefaultAttendanceMethod = () => "QR";

export default {
  normalizeAttendanceMethod,
  mapAttendanceMethodToApi,
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod
};
