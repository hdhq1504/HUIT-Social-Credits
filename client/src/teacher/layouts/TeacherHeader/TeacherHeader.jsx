import React from 'react';
import classNames from 'classnames/bind';
import { Dropdown, Avatar, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from './TeacherHeader.module.scss';

const cx = classNames.bind(styles);

export default function TeacherHeader({
  onToggleSidebar,
  user = { name: 'Giảng viên', email: 'teacher@huit.edu.vn', avatarUrl: '' },
  onLogout,
}) {
  const menuItems = [
    { key: 'home', icon: '', label: 'Trang chủ' },
    { key: 'logout', icon: '', label: 'Đăng xuất' },
  ];

  const onMenuClick = ({ key }) => {
    if (key === 'home') window.location.assign('/teacher/classes');
    if (key === 'logout') onLogout?.();
  };

  return (
    <header className={cx('teacher-header')}>
      <Button
        className={cx('teacher-header__toggle')}
        type="default"
        size="large"
        icon={<FontAwesomeIcon icon={faBars} />}
        onClick={onToggleSidebar}
        aria-label="Đóng/mở thanh điều hướng"
      />

      <Dropdown
        className={cx('teacher-header__account')}
        menu={{ items: menuItems, onClick: onMenuClick }}
        trigger={['click']}
        placement="bottomRight"
      >
        <button type="button" className={cx('teacher-header__account-box')} aria-haspopup="menu">
          <Avatar className={cx('teacher-header__avatar')} size={40} src={user?.avatarUrl || undefined}>
            {!user?.avatarUrl && user?.name ? user.name[0] : null}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className={cx('teacher-header__name')}>{user?.name || 'Giảng viên'}</span>
            <span className={cx('teacher-header__email')}>{user?.email || 'teacher@huit.edu.vn'}</span>
          </div>
          <FontAwesomeIcon icon={faChevronDown} className={cx('teacher-header__chevron')} />
        </button>
      </Dropdown>
    </header>
  );
}
