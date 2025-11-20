import React from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import { ROUTE_PATHS } from '@/config/routes.config';
import styles from './TeacherNavbar.module.scss';

const cx = classNames.bind(styles);

function TeacherNavbar({ pageTitle, actions, breadcrumbs }) {
  const renderBreadcrumbs = () => {
    if (breadcrumbs) {
      return (
        <div className={cx('teacher-navbar__breadcrumb')}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast) {
              return (
                <span key={index} className={cx('teacher-navbar__breadcrumb-current')}>
                  {crumb.label}
                </span>
              );
            }
            return (
              <React.Fragment key={index}>
                <Link to={crumb.path} className={cx('teacher-navbar__breadcrumb-home')}>
                  {crumb.label}
                </Link>
                <span className={cx('teacher-navbar__breadcrumb-slash')}>/</span>
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    return (
      <div className={cx('teacher-navbar__breadcrumb')}>
        <Link to={ROUTE_PATHS.TEACHER.CLASSES} className={cx('teacher-navbar__breadcrumb-home')}>
          Trang chủ
        </Link>
        <span className={cx('teacher-navbar__breadcrumb-slash')}>/</span>
        <span className={cx('teacher-navbar__breadcrumb-current')}>{pageTitle}</span>
      </div>
    );
  };

  const renderTitle = () => {
    const title = breadcrumbs ? breadcrumbs[breadcrumbs.length - 1].label : pageTitle;
    return <span className={cx('teacher-navbar__title')}>{title}</span>;
  };

  const renderActions = () => {
    if (actions) {
      return (
        <div className={cx('teacher-navbar__actions')}>
          {actions.map((action) => (
            <Button
              key={action.key}
              type={action.type || 'default'}
              icon={<FontAwesomeIcon icon={faPlus} />}
              onClick={action.onClick}
              danger={action.danger}
              className={cx('teacher-navbar__btn--primary')}
              loading={action.loading}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cx('teacher-navbar')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {renderBreadcrumbs()}
        {renderTitle()}
      </div>
      {renderActions()}
    </div>
  );
}

export default TeacherNavbar;
