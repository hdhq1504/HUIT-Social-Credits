import React from 'react';
import classNames from 'classnames/bind';
import { Avatar, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import styles from './AdminHeader.module.scss';

const cx = classNames.bind(styles);

export default function AdminHeader({
  onToggleSidebar,
  user = { name: 'Admin', email: 'admin@huit.edu.vn', avatarUrl: '' },
}) {
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

      <div className={cx('admin-header__account')}>
        <div className={cx('admin-header__account-box')}>
          <Avatar className={cx('admin-header__avatar')} size={40} src={user?.avatarUrl || undefined}>
            {!user?.avatarUrl && user?.name ? user.name[0] : null}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className={cx('admin-header__name')}>{user?.name || 'Admin'}</span>
            <span className={cx('admin-header__email')}>{user?.email || 'admin@huit.com'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
