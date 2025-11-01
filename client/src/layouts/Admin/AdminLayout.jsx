import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import styles from './styles/AdminLayout.module.css';

// Import các trang
import DashboardPage from '../../pages/Admin/A_Dashboard/A_Dashboard.jsx';
import ActivitiesPage from '../../pages/Admin/A_Activities_List/A_Activities_List.jsx';
import ScoringPage from '../../pages/Admin/A_Scoring_List/A_Scoring_List.jsx';
import ProofPage from '../../pages/Admin/A_Proof_List/A_Proof_List.jsx';
import ReportsPage from '../../pages/Admin/ReportsPage';
import CouncilPage from '../../pages/Admin/CouncilPage';
import SystemPage from '../../pages/Admin/SystemPage';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('Bảng điều khiển');

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const renderPage = () => {
    switch (currentPage) {
      case 'Bảng điều khiển':
        return <DashboardPage />;
      case 'Hoạt động CTXH':
        return <ActivitiesPage />;
      case 'Điểm & Minh chứng':
        return <ScoringPage />;
      case 'Phản hồi sinh viên':
        return <ProofPage />;
      case 'Báo cáo & thống kê':
        return <ReportsPage />;
      case 'Hội đồng xét điểm':
        return <CouncilPage />;
      case 'Quản lý hệ thống':
        return <SystemPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.open : styles.closed}`}>
        <AdminSidebar setCurrentPage={setCurrentPage} currentPage={currentPage} />
      </div>

      {/* Phần chính */}
      <div className={styles.mainWrapper}>
        <AdminHeader onToggleSidebar={handleToggleSidebar} isOpen={sidebarOpen} />
        <AdminNavbar currentPage={currentPage} />
        <div className={styles.contentBody}>{renderPage()}</div>
      </div>
    </div>
  );
}
