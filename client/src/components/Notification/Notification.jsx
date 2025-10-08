import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { notification as antdNotification } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faCalendarCheck,
  faFileCircleCheck,
  faChartLine,
  faCheckDouble,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import styles from './Notification.module.scss';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

const TYPE_ICON = {
  warning: faTriangleExclamation,
  success: faCalendarCheck,
  info: faFileCircleCheck,
  danger: faChartLine,
};

function Notification() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await mockApi.getNotifications();
      setItems(data);
    })();
  }, []);

  const handleMarkAll = async () => {
    await mockApi.markAllNotificationsRead();
    setItems((prev) => prev.map((it) => ({ ...it, isUnread: false })));

    antdNotification.open({
      message: 'Đã đánh dấu tất cả là đã đọc',
      description: 'Mọi thông báo hiện tại đã được cập nhật trạng thái.',
      placement: 'topRight',
      icon: <FontAwesomeIcon icon={faCheckDouble} />,
      duration: 2.2,
    });
  };

  return (
    <div className={cx('notification')}>
      <div className={cx('notification__header')}>
        <div className={cx('notification__title')}>Thông báo</div>

        <button type="button" className={cx('notification__mark-all')} onClick={handleMarkAll}>
          <FontAwesomeIcon icon={faCheck} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className={cx('notification__list')}>
        {items.map((n) => (
          <div key={n.id} className={cx('notification__item', { 'notification__item--unread': n.isUnread })}>
            <div className={cx('notification__icon-wrap', `notification__icon-wrap--${n.type}`)}>
              <FontAwesomeIcon icon={TYPE_ICON[n.type] || faCircleCheck} />
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
