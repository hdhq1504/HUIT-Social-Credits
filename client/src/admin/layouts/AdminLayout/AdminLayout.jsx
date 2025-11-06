import React, { useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminHeader from '../AdminHeader/AdminHeader';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import AdminBodyContent from '../AdminBodyContent/AdminBodyContent';
import styles from './AdminLayout.module.scss';
import { ROUTE_PATHS } from '@/config/routes.config';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';

const cx = classNames.bind(styles);

const sidebarItems = [
  { path: ROUTE_PATHS.ADMIN.DASHBOARD, label: 'Bảng điều khiển', iconKey: 'dashboard' },
  { path: ROUTE_PATHS.ADMIN.ACTIVITIES, label: 'Hoạt động CTXH', iconKey: 'activities' },
  { path: ROUTE_PATHS.ADMIN.SCORING, label: 'Điểm & Minh chứng', iconKey: 'scoring' },
  { path: ROUTE_PATHS.ADMIN.FEEDBACK, label: 'Phản hồi sinh viên', iconKey: 'feedback' },
  { path: ROUTE_PATHS.ADMIN.REPORTS, label: 'Báo cáo & Thống kê', iconKey: 'reports' },
  { path: ROUTE_PATHS.ADMIN.COUNCIL, label: 'Hội đồng xét điểm', iconKey: 'council' },
  { path: ROUTE_PATHS.ADMIN.SYSTEM, label: 'Quản lý hệ thống', iconKey: 'system' },
];

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [pageActions, setPageActions] = useState(null);

  const defaultLabel = sidebarItems[0]?.label ?? 'Bảng điều khiển';
  const activeItem = useMemo(
    () => sidebarItems.find((item) => location.pathname.startsWith(item.path)),
    [location.pathname],
  );

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleNavigate = (path) => navigate(path);

  return (
    <div className={cx('admin-layout')}>
      <div
        className={`${cx('admin-layout__sidebar')} ${
          isSidebarOpen ? cx('admin-layout__sidebar--open') : cx('admin-layout__sidebar--closed')
        }`}
      >
        <AdminSidebar
          items={sidebarItems}
          activePath={activeItem?.path ?? ''}
          isOpen={isSidebarOpen}
          onNavigate={handleNavigate}
        />
      </div>

      <AdminPageContext.Provider value={setPageActions}>
        <div className={cx('admin-layout__main')}>
          <div className={cx('admin-layout__header')}>
            <AdminHeader onToggleSidebar={handleToggleSidebar} isOpen={isSidebarOpen} />
          </div>

          <AdminBodyContent pageTitle={activeItem?.label ?? defaultLabel} pageActions={pageActions}>
            <Outlet />
          </AdminBodyContent>
        </div>
      </AdminPageContext.Provider>
    </div>
  );
}

export default AdminLayout;
