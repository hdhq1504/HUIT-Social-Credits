import React from 'react';
import { notification } from 'antd';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Toast.module.scss';

const cx = classNames.bind(styles);

/** Map icon theo variant */
const ICONS = {
  success: <FontAwesomeIcon icon={faCircleCheck} />,
  danger: <FontAwesomeIcon icon={faCircleXmark} />,
  warning: <FontAwesomeIcon icon={faExclamationCircle} />,
};

/**
 * Custom hook để hiển thị toast notification.
 * Sử dụng Ant Design notification API bên dưới.
 *
 * @returns {Object} Object chứa contextHolder và hàm open.
 * @returns {React.ReactNode} returns.contextHolder - Element cần render trong component.
 * @returns {Function} returns.open - Hàm mở toast notification.
 *
 * @example
 * function MyComponent() {
 *   const { contextHolder, open: openToast } = useToast();
 *
 *   const handleClick = () => {
 *     openToast({ message: 'Thao tác thành công!', variant: 'success' });
 *   };
 *
 *   return (
 *     <>
 *       {contextHolder}
 *       <button onClick={handleClick}>Click</button>
 *     </>
 *   );
 * }
 */
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
