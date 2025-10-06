import React from 'react';
import styles from './Button.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Button({
  children,
  variant = 'primary',
  icon,
  disabled,
  onClick,
  type = 'button',
  size = 'medium',
  fullWidth = false,
  className,
}) {
  return (
    <button
      className={cx(
        'button',
        `button--${variant}`,
        `button--${size}`,
        {
          'button--icon': !!icon,
          'button--disabled': disabled,
          'button--full-width': fullWidth,
        },
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
      variant={variant}
    >
      {icon && <span className={cx('button__icon')}>{icon}</span>}
      <span className={cx('button__text')}>{children}</span>
    </button>
  );
}

export default Button;
