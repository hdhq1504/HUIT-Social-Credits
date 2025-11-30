const ATTENDANCE_METHOD_MAP = {
  PHOTO: "photo"
};

const LABEL_MAP = {
  photo: "Chụp Ảnh"
};

/**
 * Chuẩn hóa giá trị phương thức điểm danh.
 * @param {string} value - Giá trị đầu vào.
 * @returns {string|null} Giá trị chuẩn hóa (PHOTO) hoặc null.
 */
export const normalizeAttendanceMethod = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "face" || normalized === "photo") {
    return "PHOTO";
  }
  return null;
};

/**
 * Map phương thức điểm danh sang giá trị API (lowercase).
 * @param {string} value - Giá trị phương thức điểm danh.
 * @returns {string|null} Giá trị API hoặc null.
 */
export const mapAttendanceMethodToApi = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "face" || normalized === "photo" || normalized === "qr") { // Allow qr to map to photo or null? Better to just map to photo or null. Let's stick to photo.
    return "photo";
  }
  return null;
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
 * @returns {string} "PHOTO".
 */
export const getDefaultAttendanceMethod = () => "PHOTO";

export default {
  normalizeAttendanceMethod,
  mapAttendanceMethodToApi,
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod
};
