import React from 'react';
import classNames from 'classnames/bind';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import styles from './AdminBodyContent.module.scss';

const cx = classNames.bind(styles);

function AdminBodyContent({ children, pageTitle }) {
  return (
    <div className={cx('admin-body')}>
      <AdminNavbar currentPage={pageTitle} />
      <div className={cx('admin-body__content')}>{children}</div>
    </div>
  );
}

export default AdminBodyContent;
