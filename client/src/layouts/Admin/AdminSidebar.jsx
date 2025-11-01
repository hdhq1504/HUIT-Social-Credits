// AdminSidebar.jsx
import React from 'react';
import styles from './styles/AdminSidebar.module.css';
import logoIcon from '@/assets/images/apple-touch-icon.png';
// Import các icons mới từ lucide-react
import {
  Gauge, // Bảng điều khiển
  HeartHandshake, // Hoạt động CTXH
  CalendarCheck, // Điểm danh hoạt động
  MessageSquare, // Phản hồi sinh viên
  BarChart2, // Báo cáo & thống kê
  Award, // Hội đồng xét điểm
  Settings, // Quản lý hệ thống
} from 'lucide-react';

export default function AdminSidebar({ setCurrentPage, currentPage, isOpen }) {
  const menuItems = [
    { title: 'Bảng điều khiển', icon: Gauge },
    { title: 'Hoạt động CTXH', icon: HeartHandshake },
    { title: 'Điểm & Minh chứng', icon: CalendarCheck },
    { title: 'Phản hồi sinh viên', icon: MessageSquare },
    { title: 'Báo cáo & thống kê', icon: BarChart2 },
    { title: 'Hội đồng xét điểm', icon: Award },
    { title: 'Quản lý hệ thống', icon: Settings },
  ];

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.logoSection}>
        <img src={logoIcon} alt="HUIT E_L" className={styles.logoImage} />
        <span className={styles.adminText}>ADMIN</span>
      </div>

      <ul className={styles.menuList}>
        {menuItems.map((item, index) => {
          const IconComponent = item.icon; // Lấy Component Icon
          const isActive = item.title === currentPage;

          return (
            <li
              key={index}
              className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
              onClick={() => setCurrentPage(item.title)}
            >
              <IconComponent size={18} className={styles.menuIcon} />
              {item.title}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
