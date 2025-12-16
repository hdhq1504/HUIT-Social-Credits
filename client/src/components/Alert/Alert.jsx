import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import styles from './Alert.module.scss';

const cx = classNames.bind(styles);

/**
 * Component hiển thị thông báo cảnh báo hoặc lỗi.
 * Hỗ trợ 2 loại: warning (cảnh báo) và danger (lỗi).
 *
 * @param {Object} props - Props của component.
 * @param {string} [props.title] - Tiêu đề của thông báo.
 * @param {string} props.message - Nội dung thông báo (bắt buộc).
 * @param {'warning'|'danger'} [props.type='warning'] - Loại thông báo.
 * @param {boolean} [props.showIcon=false] - Hiển thị icon tương ứng với loại thông báo.
 * @returns {React.ReactElement} Component Alert.
 *
 * @example
 * <Alert
 *   title="Cảnh báo"
 *   message="Thao tác này không thể hoàn tác."
 *   type="warning"
 *   showIcon
 * />
 */
function Alert({ title, message, type = 'warning', showIcon = false }) {
  return (
    <div className={cx('alert', `alert--${type}`)}>
      <div className={cx('alert__wrapper')}>
        {showIcon && (
          <span className={cx('alert__icon')}>
            {type === 'danger' && <FontAwesomeIcon icon={faCircleXmark} />}
            {type === 'warning' && <FontAwesomeIcon icon={faTriangleExclamation} />}
          </span>
        )}
        <div className={cx('alert__content')}>
          <span className={cx('alert__title')}>{title}</span>
          <span className={cx('alert__message')}>{message}</span>
        </div>
      </div>
    </div>
  );
}

Alert.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['warning', 'danger']),
  showIcon: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default Alert;
