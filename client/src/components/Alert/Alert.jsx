import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import styles from './Alert.module.scss';

const cx = classNames.bind(styles);

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
