import React from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import { ROUTE_PATHS } from '@/config/routes.config';
import styles from './AdminNavbar.module.scss';

const cx = classNames.bind(styles);

function AdminNavbar({ currentPage, actions }) {
  const renderActions = () => {
    if (!actions) {
      return (
        <Link to={ROUTE_PATHS.ADMIN.ACTIVITY_CREATE} className={cx('admin-navbar__add-button')}>
          <FontAwesomeIcon icon={faPlus} />
          <span style={{ marginLeft: '5px' }}>Thêm mới hoạt động mới</span>
        </Link>
      );
    }

    return (
      <div className={cx('admin-navbar__actions')}>
        {actions.map((action) => (
          <Button
            key={action.key}
            type={action.type || 'default'}
            icon={action.icon}
            onClick={action.onClick}
            danger={action.danger}
            className={cx('admin-navbar__action-btn', action.className)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className={cx('admin-navbar')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className={cx('admin-navbar__breadcrumb')}>
          <Link to={ROUTE_PATHS.ADMIN.DASHBOARD} className={cx('admin-navbar__breadcrumb-home')}>
            Trang chủ
          </Link>
          <span className={cx('admin-navbar__breadcrumb-slash')}>/</span>
          <span className={cx('admin-navbar__breadcrumb-current')}>{currentPage}</span>
        </div>
        <span className={cx('admin-navbar__title')}>{currentPage}</span>
      </div>

      {renderActions()}
    </div>
  );
}

export default AdminNavbar;
