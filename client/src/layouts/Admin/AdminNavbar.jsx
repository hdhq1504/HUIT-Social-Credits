import React from 'react';
import styles from './styles/AdminNavbar.module.css';

export default function AdminNavbar({ currentPage }) {
  return (
    <div className={styles.navbar}>
      <div className={styles.breadcrumbSection}>
        <span className={styles.home}>Trang chủ</span>
        <span className={styles.slash}>/</span>
        <span className={styles.current}>{currentPage}</span>
      </div>
    </div>
  );
}
