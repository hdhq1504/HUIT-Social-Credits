import React from 'react';
import styles from './Button.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Button({
  children,
  variant = 'primary',
  icon,
  leftIcon,
  rightIcon,
  disabled,
  loading = false,
  onClick,
  type = 'button',
  size = 'medium',
  fullWidth = false,
  className,
  as: Comp = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const hasIcon = !!(leftIcon || icon || rightIcon);

  const content = (
    <>
      {(leftIcon || icon) && <span className={cx('button__icon')}>{leftIcon || icon}</span>}
      <span className={cx('button__text')}>{children}</span>
      {rightIcon && <span className={cx('button__icon', 'button__icon--right')}>{rightIcon}</span>}
      {loading && (
        <span className={cx('button__spinner')} aria-hidden="true">
          <svg viewBox="0 0 50 50" className={cx('spinner')}>
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
          </svg>
        </span>
      )}
    </>
  );

  const classList = cx(
    'button',
    `button--${variant}`,
    `button--${size}`,
    {
      'button--icon': hasIcon,
      'button--disabled': isDisabled,
      'button--full-width': fullWidth,
      'button--loading': loading,
    },
    className,
  );

  if (Comp !== 'button') {
    return (
      <Comp className={classList} onClick={onClick} aria-disabled={isDisabled || undefined} {...rest}>
        {content}
      </Comp>
    );
  }

  return (
    <button className={classList} onClick={onClick} disabled={isDisabled} type={type} data-variant={variant} {...rest}>
      {content}
    </button>
  );
}

export default Button;
