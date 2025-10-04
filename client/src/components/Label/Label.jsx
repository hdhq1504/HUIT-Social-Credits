import React from 'react';
import classNames from 'classnames/bind';
import styles from './Label.module.scss';

const cx = classNames.bind(styles);

function Label({ title, highlight, subtitle }) {
  return (
    <div className={cx('label')}>
      <div className={cx('label__wrapper')}>
        <div className={cx('label__divider')}></div>

        <div className={cx('label__container')}>
          <span className={cx('label__title')}>
            {title} <span className={cx('label__highlight')}>{highlight}</span>
          </span>
        </div>

        <div className={cx('label__divider')}></div>
      </div>

      <div className={cx('label__subtitle')}>
        <div className={cx('label__subtitle-text')}>{subtitle}</div>
      </div>
    </div>
  );
}

export default Label;
