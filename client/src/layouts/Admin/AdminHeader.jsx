import React from 'react';
import styles from './styles/AdminHeader.module.css';

export default function AdminHeader({ onToggleSidebar, isOpen }) {
  return (
    <header className={styles.header}>
      <button className={`${styles.menuButton} ${isOpen ? 'open' : ''}`} onClick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={styles.dropdownAdmin}>
        <div className={styles.dropdownBox}>
          <div className={styles.avatar}></div>
          <div className={styles.textBox}>
            <span className={styles.adminName}>Admin</span>
            <span className={styles.adminEmail}>admin@huit.edu.vn</span>
          </div>
        </div>
      </div>
    </header>
  );
}
