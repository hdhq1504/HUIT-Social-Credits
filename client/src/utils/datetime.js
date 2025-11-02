import dayjs from 'dayjs';

/**
 * Định dạng giá trị ngày dạng ISO hoặc Date thành chuỗi theo mẫu cho trước.
 * Luôn trả về chuỗi dự phòng "--" nếu dữ liệu không hợp lệ để tránh lỗi giao diện.
 */
export const formatDate = (value, format = 'DD/MM/YYYY') => {
  if (!value) return '--';
  const date = dayjs(value);
  return date.isValid() ? date.format(format) : '--';
};

/**
 * Định dạng giá trị thời gian theo định dạng giờ-phút kèm ngày, dùng cho thời gian chi tiết.
 */
export const formatDateTime = (value, format = 'HH:mm DD/MM/YYYY') => {
  if (!value) return '--';
  const date = dayjs(value);
  return date.isValid() ? date.format(format) : '--';
};

/**
 * Trả về chuỗi mô tả khoảng thời gian trong ngày (HH:mm - HH:mm).
 * Nếu thiếu một trong hai mốc thì thay bằng "--" để người dùng dễ nhận biết.
 */
export const formatTimeRange = (start, end) => {
  if (!start && !end) return '--';
  const startValue = start ? dayjs(start) : null;
  const endValue = end ? dayjs(end) : null;
  const startLabel = startValue?.isValid() ? startValue.format('HH:mm') : '--';
  const endLabel = endValue?.isValid() ? endValue.format('HH:mm') : '--';
  return `${startLabel} - ${endLabel}`;
};

/**
 * Trả về chuỗi mô tả khoảng thời gian đầy đủ bao gồm giờ và ngày.
 * Ưu tiên hiển thị theo từng ngày nếu hai mốc khác ngày nhau.
 */
export const formatDateTimeRange = (start, end) => {
  if (!start) return 'Thời gian sẽ được cập nhật sau';

  const startDate = dayjs(start);
  if (!startDate.isValid()) return 'Thời gian sẽ được cập nhật sau';

  if (!end) {
    return `${startDate.format('HH:mm')}, ${startDate.format('DD/MM/YYYY')}`;
  }

  const endDate = dayjs(end);
  if (!endDate.isValid()) {
    return `${startDate.format('HH:mm')}, ${startDate.format('DD/MM/YYYY')}`;
  }

  if (startDate.isSame(endDate, 'day')) {
    return `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}, ${startDate.format('DD/MM/YYYY')}`;
  }

  return `${startDate.format('HH:mm, DD/MM/YYYY')} - ${endDate.format('HH:mm, DD/MM/YYYY')}`;
};

export default {
  formatDate,
  formatDateTime,
  formatTimeRange,
  formatDateTimeRange,
};
