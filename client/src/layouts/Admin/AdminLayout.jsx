import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('Bảng điều khiển');

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.open : styles.closed}`}>
        <AdminSidebar setCurrentPage={setCurrentPage} />
      </div>

      {/* Main wrapper */}
      <div className={styles.mainWrapper}>
        <AdminHeader onToggleSidebar={handleToggleSidebar} />
        <AdminNavbar currentPage={currentPage} />
        <div className={styles.contentBody}>{children}</div>
      </div>
    </div>
  );
}
