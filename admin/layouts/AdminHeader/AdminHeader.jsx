import React from 'react';
import styles from './AdminHeader.module.scss';

export default function AdminHeader({ onToggleSidebar }) {
  return (
    <header className={styles.adminHeader}>
      <button className={`${styles.adminHeader__menuButton}`} onClick={onToggleSidebar}>
        <span className={styles.adminHeader__menuLine}></span>
        <span className={styles.adminHeader__menuLine}></span>
        <span className={styles.adminHeader__menuLine}></span>
      </button>

      <div className={styles.adminHeader__account}>
        <div className={styles.adminHeader__accountBox}>
          <div className={styles.adminHeader__avatar}></div>
          <div className={styles.adminHeader__textBox}>
            <span className={styles.adminHeader__name}>Admin</span>
            <span className={styles.adminHeader__email}>admin@huit.edu.vn</span>
          </div>
        </div>
      </div>
    </header>
  );
}
