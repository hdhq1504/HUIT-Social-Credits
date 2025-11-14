import dayjs from 'dayjs';

export const formatDate = (value, format = 'DD/MM/YYYY') => {
  if (!value) return '--';
  const date = dayjs(value);
  return date.isValid() ? date.format(format) : '--';
};

export const formatDateTime = (value, format = 'HH:mm DD/MM/YYYY') => {
  if (!value) return '--';
  const date = dayjs(value);
  return date.isValid() ? date.format(format) : '--';
};

export const formatTimeRange = (start, end) => {
  if (!start && !end) return '--';
  const startValue = start ? dayjs(start) : null;
  const endValue = end ? dayjs(end) : null;
  const startLabel = startValue?.isValid() ? startValue.format('HH:mm') : '--';
  const endLabel = endValue?.isValid() ? endValue.format('HH:mm') : '--';
  return `${startLabel} - ${endLabel}`;
};

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
