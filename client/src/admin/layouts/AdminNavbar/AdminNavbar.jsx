import React from 'react';
import classNames from 'classnames/bind';
import styles from './AdminNavbar.module.scss';

const cx = classNames.bind(styles);

export default function AdminNavbar({ currentPage }) {
  return (
    <div className={cx('admin-navbar')}>
      <div className={cx('admin-navbar__breadcrumb')}>
        <span className={cx('admin-navbar__breadcrumb-home')}>Trang chủ</span>
        <span className={cx('admin-navbar__breadcrumb-slash')}>/</span>
        <span className={cx('admin-navbar__breadcrumb-current')}>{currentPage}</span>
      </div>

      {/* <button className={cx('admin-navbar__add-button')}>Thêm mới</button> */}
    </div>
  );
}
