import React from 'react';
import styles from './AdminHeader.module.css';

export default function AdminHeader({ onToggleSidebar, isOpen }) {
  return (
    <header className={styles.header}>
      <button className={`${styles.menuButton} ${isOpen ? 'open' : ''}`} onClick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <h3 className={styles.pageTitle}>Trang Quản trị</h3>

      <div className={styles.dropdownAdmin}>
        <div className={styles.dropdownBox}>
          <div className={styles.avatar}></div>
          <div className={styles.textBox}>
            <span className={styles.adminName}>Admin</span>
            <span className={styles.adminEmail}>admin@huit.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
