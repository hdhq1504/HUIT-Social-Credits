import React from 'react';
import classNames from 'classnames/bind';
import styles from './AdminHeader.module.scss';

const cx = classNames.bind(styles);

export default function AdminHeader({ onToggleSidebar, isOpen }) {
  return (
    <header className={cx('admin-header')}>
      <button
        type="button"
        className={cx('admin-header__menu-button', { 'admin-header__menu-button--open': isOpen })}
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span className={cx('admin-header__menu-line')} />
        <span className={cx('admin-header__menu-line')} />
        <span className={cx('admin-header__menu-line')} />
      </button>

      <div className={cx('admin-header__account')}>
        <div className={cx('admin-header__account-box')}>
          <div className={cx('admin-header__avatar')} />
          <div className={cx('admin-header__text-box')}>
            <span className={cx('admin-header__name')}>Admin</span>
            <span className={cx('admin-header__email')}>admin@huit.edu.vn</span>
          </div>
        </div>
      </div>
    </header>
  );
}
