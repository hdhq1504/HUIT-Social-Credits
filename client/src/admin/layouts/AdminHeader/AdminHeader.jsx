import React from 'react';
import classNames from 'classnames/bind';
import { Dropdown, Avatar, Button, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from './AdminHeader.module.scss';

const cx = classNames.bind(styles);

export default function AdminHeader({
  onToggleSidebar,
  user = { name: 'Admin', email: 'admin@huit.edu.vn', avatarUrl: '' },
  onLogout,
}) {
  const menuItems = [
    { key: 'home', icon: '', label: 'Trang chủ' },
    { key: 'logout', icon: '', label: 'Đăng xuất' },
  ];

  const onMenuClick = ({ key }) => {
    if (key === 'home') window.location.assign('/admin/dashboard');
    if (key === 'logout') onLogout?.();
  };

  return (
    <header className={cx('admin-header')}>
      <Button
        className={cx('admin-header__toggle')}
        type="default"
        size="large"
        icon={<FontAwesomeIcon icon={faBars} />}
        onClick={onToggleSidebar}
        aria-label="Đóng/mở thanh điều hướng"
      />

      <Dropdown
        className={cx('admin-header__account')}
        menu={{ items: menuItems, onClick: onMenuClick }}
        trigger={['click']}
        placement="bottomRight"
      >
        <button type="button" className={cx('admin-header__account-box')} aria-haspopup="menu">
          <Avatar className={cx('admin-header__avatar')} size={40} src={user?.avatarUrl || undefined}>
            {!user?.avatarUrl && user?.name ? user.name[0] : null}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className={cx('admin-header__name')}>{user?.name || 'Admin'}</span>
            <span className={cx('admin-header__email')}>{user?.email || 'admin@huit.com'}</span>
          </div>
          <FontAwesomeIcon icon={faChevronDown} className={cx('admin-header__chevron')} />
        </button>
      </Dropdown>
    </header>
  );
}
