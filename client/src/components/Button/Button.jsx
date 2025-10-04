import React from 'react';
import styles from './Button.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Button({ children, variant = 'primary', icon, disabled, onClick }) {
  return (
    <button className={cx('button', variant, { icon: icon, disabled: disabled })} onClick={onClick} disabled={disabled}>
      {icon && <span className={cx('button__icon')}>{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
