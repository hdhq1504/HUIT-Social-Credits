import React from 'react';
import classNames from 'classnames/bind';
import styles from './Label.module.scss';

const cx = classNames.bind(styles);

/**
 * Component hiển thị nhãn tiêu đề với divider và subtitle.
 * Thường dùng để phân chia các section trong trang.
 *
 * @param {Object} props - Props của component.
 * @param {string} props.title - Tiêu đề chính.
 * @param {string} [props.highlight] - Phần được highlight trong tiêu đề.
 * @param {string} [props.subtitle] - Phụ đề hiển thị bên dưới.
 * @param {boolean} [props.leftDivider=true] - Hiển thị divider bên trái.
 * @param {boolean} [props.rightDivider=true] - Hiển thị divider bên phải.
 * @param {boolean} [props.showSubtitle=true] - Hiển thị phụ đề.
 * @param {string} [props.className] - Class CSS bổ sung.
 * @returns {React.ReactElement} Component Label.
 *
 * @example
 * <Label
 *   title="Hoạt động"
 *   highlight="nổi bật"
 *   subtitle="Các hoạt động đang diễn ra"
 * />
 */
function Label({
  title,
  highlight,
  subtitle,
  leftDivider = true,
  rightDivider = true,
  showSubtitle = true,
  className,
}) {
  return (
    <div className={cx('label', className)}>
      <div className={cx('label__wrapper')}>
        {leftDivider && <div className={cx('label__divider')} />}

        <div className={cx('label__container')}>
          <span className={cx('label__title')}>
            {title} <span className={cx('label__highlight')}>{highlight}</span>
          </span>
        </div>

        {rightDivider && <div className={cx('label__divider')} />}
      </div>

      {showSubtitle && subtitle && (
        <div className={cx('label__subtitle')}>
          <div className={cx('label__subtitle-text')}>{subtitle}</div>
        </div>
      )}
    </div>
  );
}

export default Label;
