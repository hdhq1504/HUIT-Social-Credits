import React from 'react';
import styles from './AdminSidebar.module.scss';
import logoIcon from '@/assets/images/apple-touch-icon.png';
import { Gauge, HeartHandshake, CalendarCheck, MessageSquare, BarChart2, Award, Settings } from 'lucide-react';

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
    <div className={`${styles.sidebar} ${isOpen ? styles['sidebar--open'] : styles['sidebar--closed']}`}>
      {/* Logo Section */}
      <div className={styles.sidebar__logo}>
        <img src={logoIcon} alt="HUIT E_L" className={styles['sidebar__logo-image']} />
        <span className={styles['sidebar__logo-text']}>ADMIN</span>
      </div>

      {/* Menu List */}
      <ul className={styles.sidebar__menu}>
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = item.title === currentPage;

          return (
            <li
              key={index}
              className={`${styles['sidebar__menu-item']} ${isActive ? styles['sidebar__menu-item--active'] : ''}`}
              onClick={() => setCurrentPage(item.title)}
            >
              <IconComponent size={18} className={styles['sidebar__menu-icon']} />
              <span className={styles['sidebar__menu-text']}>{item.title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
