import React from 'react';
import { notification } from 'antd';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Toast.module.scss';

const cx = classNames.bind(styles);

export default function useToast() {
  const [api, contextHolder] = notification.useNotification();

  const open = ({ message, variant = 'success', duration = 3 }) => {
    const icons = {
      success: <FontAwesomeIcon icon={faCircleCheck} />,
      danger: <FontAwesomeIcon icon={faCircleXmark} />,
      warning: <FontAwesomeIcon icon={faExclamationCircle} />,
    };

    api.open({
      message: (
        <div className={cx('toast', `toast--${variant}`)}>
          <div className={cx('toast__iconWrap')}>
            <span className={cx('toast__icon')}>{icons[variant]}</span>
          </div>
          <div className={cx('toast__message')}>{message}</div>
        </div>
      ),
      placement: 'bottomRight',
      duration,
      className: cx('toast__notice'),
      style: { padding: 0, background: 'transparent', boxShadow: 'none', width: '320px' },
      closeIcon: null,
    });
  };

  return { contextHolder, open };
}
