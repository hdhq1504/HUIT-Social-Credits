import React, { useMemo } from 'react';
import classNames from 'classnames/bind';
import { notification as antdNotification } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faChartLine,
  faCheck,
  faCheckDouble,
  faFileCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import styles from './Notification.module.scss';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import notificationsApi, {
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '@api/notifications.api';
import useAuthStore from '@stores/useAuthStore';

const cx = classNames.bind(styles);

const TYPE_ICON = {
  warning: faTriangleExclamation,
  success: faCalendarCheck,
  info: faFileCircleCheck,
  danger: faChartLine,
};

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

const RELATIVE_TIME_RANGES = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629800, divisor: 604800, unit: 'week' },
  { limit: 31557600, divisor: 2629800, unit: 'month' },
  { limit: Infinity, divisor: 31557600, unit: 'year' },
];

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteDiff = Math.abs(diffInSeconds);

  for (const range of RELATIVE_TIME_RANGES) {
    if (absoluteDiff < range.limit) {
      const divisor = range.divisor || 1;
      const valueRounded = Math.round(diffInSeconds / divisor);
      return RELATIVE_TIME_FORMATTER.format(valueRounded, range.unit);
    }
  }

  return '';
};

function Notification({ onMarkAllRead }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsApi.list({ limit: 30 }),
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY });
      onMarkAllRead?.();

      antdNotification.open({
        message: 'Đã đánh dấu tất cả là đã đọc',
        description: 'Mọi thông báo hiện tại đã được cập nhật trạng thái.',
        placement: 'topRight',
        icon: <FontAwesomeIcon icon={faCheckDouble} />,
        duration: 2.2,
      });
    },
    onError: () => {
      antdNotification.open({
        message: 'Không thể cập nhật thông báo',
        description: 'Vui lòng thử lại sau ít phút.',
        placement: 'topRight',
        icon: <FontAwesomeIcon icon={faTriangleExclamation} />,
        duration: 2.2,
      });
    },
  });

  const items = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        timeAgo: formatRelativeTime(notification.createdAt),
      })),
    [notifications],
  );

  const handleMarkAll = () => {
    if (!items.length || markAllMutation.isPending) return;
    markAllMutation.mutate();
  };

  return (
    <div className={cx('notification')}>
      <div className={cx('notification__header')}>
        <div className={cx('notification__title')}>Thông báo</div>

        <button
          type="button"
          className={cx('notification__mark-all')}
          onClick={handleMarkAll}
          disabled={!isLoggedIn || !items.length || markAllMutation.isPending}
        >
          <FontAwesomeIcon icon={faCheck} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className={cx('notification__list')}>
        {!isLoggedIn && <div className={cx('notification__empty')}>Vui lòng đăng nhập để xem thông báo.</div>}

        {isLoggedIn && isLoading && <div className={cx('notification__empty')}>Đang tải thông báo...</div>}

        {isLoggedIn && isError && !isLoading && (
          <div className={cx('notification__empty')}>Không thể tải thông báo. Vui lòng thử lại sau.</div>
        )}

        {isLoggedIn && !isLoading && !items.length && !isError && (
          <div className={cx('notification__empty')}>Bạn chưa có thông báo nào.</div>
        )}

        {isLoggedIn &&
          items.map((n) => (
            <div key={n.id} className={cx('notification__item', { 'notification__item--unread': n.isUnread })}>
              <div className={cx('notification__icon-wrap', `notification__icon-wrap--${n.type}`)}>
                <FontAwesomeIcon icon={TYPE_ICON[n.type] || faFileCircleCheck} />
              </div>

              <div className={cx('notification__content')}>
                <div className={cx('notification__heading')}>{n.title}</div>
                <div className={cx('notification__desc')}>{n.description}</div>
                <div className={cx('notification__time')}>{n.timeAgo}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Notification;
