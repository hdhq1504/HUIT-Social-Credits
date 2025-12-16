import React from 'react';
import styles from './Button.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

/**
 * Component nút bấm đa năng với nhiều biến thể và trạng thái.
 * Hỗ trợ hiển thị icon, loading spinner và có thể render như các element khác nhau.
 *
 * @param {Object} props - Props của component.
 * @param {React.ReactNode} props.children - Nội dung hiển thị trong nút.
 * @param {'primary'|'secondary'|'outline'|'danger'|'success'|'muted'|'orange'} [props.variant='primary'] - Kiểu dáng của nút.
 * @param {React.ReactNode} [props.icon] - Icon hiển thị bên trái (alias của leftIcon).
 * @param {React.ReactNode} [props.leftIcon] - Icon hiển thị bên trái.
 * @param {React.ReactNode} [props.rightIcon] - Icon hiển thị bên phải.
 * @param {boolean} [props.disabled] - Vô hiệu hóa nút.
 * @param {boolean} [props.loading=false] - Hiển thị trạng thái loading với spinner.
 * @param {Function} [props.onClick] - Hàm xử lý khi click nút.
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Loại button HTML.
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Kích thước của nút.
 * @param {boolean} [props.fullWidth=false] - Nút chiếm toàn bộ chiều rộng container.
 * @param {string} [props.className] - Class CSS bổ sung.
 * @param {React.ElementType} [props.as='button'] - Element type để render (vd: 'a', Link).
 * @returns {React.ReactElement} Component Button.
 *
 * @example
 * // Nút primary với icon
 * <Button variant="primary" leftIcon={<Icon />}>Lưu</Button>
 *
 * @example
 * // Nút loading
 * <Button loading>Đang xử lý...</Button>
 */
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
  // disabled thực tế khi component đang loading hoặc có props disabled
  const isDisabled = disabled || loading;
  const hasIcon = !!(leftIcon || icon || rightIcon);

  const content = (
    <>
      {/* leftIcon hoặc icon */}
      {(leftIcon || icon) && <span className={cx('button__icon')}>{leftIcon || icon}</span>}
      <span className={cx('button__text')}>{children}</span>
      {rightIcon && <span className={cx('button__icon', 'button__icon--right')}>{rightIcon}</span>}
      {/* Spinner khi loading */}
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

  // Nếu as !== 'button' (ví dụ Link), dùng aria-disabled để tránh a/button semantics issues
  if (Comp !== 'button') {
    return (
      <Comp className={classList} onClick={onClick} aria-disabled={isDisabled || undefined} {...rest}>
        {content}
      </Comp>
    );
  }

  // Khi component là button, truyền disabled attribute thật
  return (
    <button className={classList} onClick={onClick} disabled={isDisabled} type={type} data-variant={variant} {...rest}>
      {content}
    </button>
  );
}

export default Button;
