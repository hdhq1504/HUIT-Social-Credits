import React from 'react';
import classNames from 'classnames/bind';
import styles from './Label.module.scss';

const cx = classNames.bind(styles);

function Label({ title, highlight, subtitle }) {
  return (
    <div className={cx('container')}>
      <div className={cx('wrapper')}>
        <div className={cx('divider')}></div>

        <div className={cx('label-container')}>
          <span className={cx('label-title')}>
            {title} <span className={cx('label-highlight')}>{highlight}</span>
          </span>
        </div>

        <div className={cx('divider')}></div>
      </div>

      <div className={cx('subtitle-wrapper')}>
        <div className={cx('label-subtitle')}>{subtitle}</div>
      </div>
    </div>
  );
}

export default Label;
