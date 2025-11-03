import React from 'react';
import AdminNavbar from '../AdminNavbar/AdminNavbar';
import { useAdmin } from './adminContext';
import styles from './AdminBodyContent.module.scss';

const AdminBodyContent = ({ children }) => {
  const { pageName } = useAdmin();

  return (
    <div className={styles.adminBody}>
      {/* Thanh navbar admin (breadcrumb + nút Add New) */}
      <AdminNavbar pageName={pageName} />

      {/* Nội dung trang con */}
      <div className={styles.adminBody__content}>{children}</div>
    </div>
  );
};

export default AdminBodyContent;
