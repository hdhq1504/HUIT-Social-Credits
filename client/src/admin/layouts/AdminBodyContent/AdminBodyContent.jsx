import React from 'react';
import classNames from 'classnames/bind';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import styles from './AdminBodyContent.module.scss';

const cx = classNames.bind(styles);

function AdminBodyContent({ pageTitle, pageActions, children }) {
  return (
    <main className={cx('admin-body')}>
      <div className={cx('admin-body__content')}>
        <AdminNavbar currentPage={pageTitle} actions={pageActions} />
        {children}
      </div>
    </main>
  );
}

export default AdminBodyContent;
