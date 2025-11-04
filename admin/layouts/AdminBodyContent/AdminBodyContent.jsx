import React from 'react';
import classNames from 'clasname/bind';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { useAdmin } from './adminContext';
import styles from './AdminBodyContent.module.scss';

const cx = classNames.bind(styles);

function AdminBodyContent({ children }) {
  const { pageName } = useAdmin();

  return (
    <div className={cx('adminBody')}>
      <AdminNavbar pageName={pageName} />

      <div className={cx('adminBody__content')}>{children}</div>
    </div>
  );
}

export default AdminBodyContent;
