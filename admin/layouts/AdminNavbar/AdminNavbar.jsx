import React from 'react';
import styles from './AdminNavbar.module.scss';

export default function AdminNavbar({ currentPage }) {
  return (
    <div className={styles.adminNavbar}>
      {/* Breadcrumb */}
      <div className={styles.adminNavbar__breadcrumb}>
        <span className={styles['adminNavbar__breadcrumb-home']}>Trang chủ</span>
        <span className={styles['adminNavbar__breadcrumb-slash']}>/</span>
        <span className={styles['adminNavbar__breadcrumb-current']}>{currentPage}</span>
      </div>

      {/* Nút thêm mới (nếu cần) */}
      {/* <button className={styles.adminNavbar__addButton}>Thêm mới</button> */}
    </div>
  );
}
