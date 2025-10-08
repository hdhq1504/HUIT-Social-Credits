import React from 'react';
import classNames from 'classnames/bind';
import styles from './Label.module.scss';

const cx = classNames.bind(styles);

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
