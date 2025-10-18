import React from 'react';
import { notification } from 'antd';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Toast.module.scss';

const cx = classNames.bind(styles);

const ICONS = {
  success: <FontAwesomeIcon icon={faCircleCheck} />,
  danger: <FontAwesomeIcon icon={faCircleXmark} />,
  warning: <FontAwesomeIcon icon={faExclamationCircle} />,
};

export default function useToast() {
  const [api, contextHolder] = notification.useNotification();

  const open = ({ message, variant = 'success', duration = 3 }) => {
    const normalizedVariant = ICONS[variant] ? variant : 'success';

    api.open({
      message: (
        <div className={cx('toast', `toast--${normalizedVariant}`)}>
          <div className={cx('toast__icon-wrapper')}>
            <span className={cx('toast__icon')}>{ICONS[normalizedVariant]}</span>
          </div>
          <div className={cx('toast__message')}>{message}</div>
        </div>
      ),
      placement: 'topRight',
      duration,
      className: cx('toast__notice'),
      closeIcon: null,
    });
  };

  return { contextHolder, open };
}
