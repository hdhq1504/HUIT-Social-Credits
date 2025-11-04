import React from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import styles from './AdminNavbar.module.scss';

const cx = classNames.bind(styles);

function AdminNavbar({ currentPage }) {
  return (
    <div className={cx('admin-navbar')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className={cx('admin-navbar__breadcrumb')}>
          <span className={cx('admin-navbar__breadcrumb-home')}>Trang chủ</span>
          <span className={cx('admin-navbar__breadcrumb-slash')}>/</span>
          <span className={cx('admin-navbar__breadcrumb-current')}>{currentPage}</span>
        </div>
        <span className={cx('admin-navbar__title')}>Bảng điều khiển tổng quan</span>
      </div>

      <button className={cx('admin-navbar__add-button')}>
        <FontAwesomeIcon icon={faPlus} />
        <span style={{ marginLeft: '5px' }}>Thêm mới hoạt động mới</span>
      </button>
    </div>
  );
}

export default AdminNavbar;
