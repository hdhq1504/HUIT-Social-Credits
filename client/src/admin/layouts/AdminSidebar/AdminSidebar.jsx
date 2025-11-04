import React from 'react';
import classNames from 'classnames/bind';
import logoIcon from '@/assets/images/apple-touch-icon.png';
import styles from './AdminSidebar.module.scss';

const cx = classNames.bind(styles);

export default function AdminSidebar({ items, activePath, isOpen, onNavigate }) {
  return (
    <aside className={cx('admin-sidebar', { 'admin-sidebar--open': isOpen, 'admin-sidebar--closed': !isOpen })}>
      <div className={cx('admin-sidebar__logo')}>
        <img src={logoIcon} alt="HUIT E_L" className={cx('admin-sidebar__logo-image')} />
        <span className={cx('admin-sidebar__logo-text')}>ADMIN</span>
      </div>

      <ul className={cx('admin-sidebar__menu')}>
        {items.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.path === activePath;

          return (
            <li
              key={item.path}
              className={cx('admin-sidebar__menu-item', { 'admin-sidebar__menu-item--active': isActive })}
              onClick={() => onNavigate(item.path)}
            >
              <IconComponent size={18} className={cx('admin-sidebar__menu-icon')} />
              <span className={cx('admin-sidebar__menu-text')}>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
