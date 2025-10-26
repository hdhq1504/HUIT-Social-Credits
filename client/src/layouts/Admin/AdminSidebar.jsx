import React from 'react';
import styles from './AdminSidebar.module.css';
import logoIcon from '../../assets/images/apple-touch-icon.png';

export default function AdminSidebar({ setCurrentPage }) {
  const menuItems = [
    'Bảng điều khiển',
    'Hoạt động CTXH',
    'Điểm danh hoạt động',
    'Phản hồi sinh viên',
    'Báo cáo & thống kê',
    'Hội đồng xét điểm',
    'Quản lý hệ thống',
  ];

  return (
    <div className={styles.sidebar}>
      {/* Logo + ADMIN */}
      <div className={styles.logoSection}>
        <img src={logoIcon} alt="HUIT E_L" className={styles.logoImage} />
        <span className={styles.adminText}>ADMIN</span>
      </div>

      {/* Menu list */}
      <ul className={styles.menuList}>
        {menuItems.map((item, index) => (
          <li key={index} className={styles.menuItem} onClick={() => setCurrentPage(item)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
