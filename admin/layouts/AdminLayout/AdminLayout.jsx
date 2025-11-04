import React, { useState } from 'react';
import AdminHeader from '../AdminHeader/AdminHeader.jsx';
import AdminSidebar from '../AdminSidebar/AdminSidebar.jsx';
import AdminNavbar from '../AdminNavbar/AdminNavbar.jsx';
import styles from './AdminLayout.module.scss';

import DashboardPage from '@pages/Admin/DashboardPage/DashboardPage.jsx';
import ActivitiesPage from '@pages/Admin/ActivitiesPage/ActivitiesPage.jsx';
import ScoringPage from '@pages/Admin/ScoringPage/ScoringPage.jsx';
import ProofPage from '@pages/Admin/ProofPage/ProofPage.jsx';
import ReportsPage from '@pages/Admin/ReportsPage';
import CouncilPage from '@pages/Admin/CouncilPage';
import SystemPage from '@pages/Admin/SystemPage';

const PAGES = {
  'Bảng điều khiển': <DashboardPage />,
  'Hoạt động CTXH': <ActivitiesPage />,
  'Điểm & Minh chứng': <ScoringPage />,
  'Phản hồi sinh viên': <ProofPage />,
  'Báo cáo & thống kê': <ReportsPage />,
  'Hội đồng xét điểm': <CouncilPage />,
  'Quản lý hệ thống': <SystemPage />,
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('Bảng điều khiển');

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className={styles['admin-layout']}>
      {/* Sidebar */}
      <div
        className={`${styles['admin-layout__sidebar']} ${
          sidebarOpen ? styles['admin-layout__sidebar--open'] : styles['admin-layout__sidebar--closed']
        }`}
      >
        <AdminSidebar setCurrentPage={setCurrentPage} currentPage={currentPage} isOpen={sidebarOpen} />
      </div>

      {/* Main content */}
      <div className={styles['admin-layout__main']}>
        {/* Header */}
        <div className={styles['admin-layout__header']}>
          <AdminHeader onToggleSidebar={handleToggleSidebar} isOpen={sidebarOpen} />
        </div>

        {/* Navbar */}
        <div className={styles['admin-layout__navbar']}>
          <AdminNavbar currentPage={currentPage} />
        </div>

        {/* Page Content */}
        <div className={styles['admin-layout__content']}>{PAGES[currentPage] || <DashboardPage />}</div>
      </div>
    </div>
  );
}
