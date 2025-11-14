const ATTENDANCE_METHOD_MAP = {
  QR: "qr",
  PHOTO: "photo"
};

const LABEL_MAP = {
  qr: "QR Code",
  photo: "Chụp Ảnh"
};

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

export const getAttendanceMethodLabel = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return LABEL_MAP[normalized] ?? null;
};

export const getDefaultAttendanceMethod = () => "QR";

export default {
  normalizeAttendanceMethod,
  mapAttendanceMethodToApi,
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod
};
