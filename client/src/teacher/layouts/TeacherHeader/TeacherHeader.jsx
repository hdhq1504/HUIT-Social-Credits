import React from 'react';
import classNames from 'classnames/bind';
import { Avatar, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import styles from './TeacherHeader.module.scss';

const cx = classNames.bind(styles);

export default function TeacherHeader({
  onToggleSidebar,
  user = { name: 'Giảng viên', email: 'teacher@huit.edu.vn', avatarUrl: '' },
}) {
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

      <div className={cx('teacher-header__account')}>
        <div type="button" className={cx('teacher-header__account-box')}>
          <Avatar className={cx('teacher-header__avatar')} size={40} src={user?.avatarUrl || undefined}>
            {!user?.avatarUrl && user?.name ? user.name[0] : null}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className={cx('teacher-header__name')}>{user?.name || 'Giảng viên'}</span>
            <span className={cx('teacher-header__email')}>{user?.email || 'teacher@huit.edu.vn'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
