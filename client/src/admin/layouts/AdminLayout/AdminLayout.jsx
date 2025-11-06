import React, { useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminHeader from '../AdminHeader/AdminHeader';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import AdminBodyContent from '../AdminBodyContent/AdminBodyContent';
import styles from './AdminLayout.module.scss';
import adminRoutes from '@/routes/adminRoutes';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';

const cx = classNames.bind(styles);

const iconByKey = {
  DashboardOutlined: 'dashboard',
  CalendarOutlined: 'activities',
  TrophyOutlined: 'scoring',
  FileSearchOutlined: 'proof',
  MessageOutlined: 'feedback',
  BarChartOutlined: 'reports',
  TeamOutlined: 'council',
  SettingOutlined: 'system',
};

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [pageActions, setPageActions] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(null);
  const contextValue = useMemo(() => ({ setPageActions, setBreadcrumbs }), []);

  const sidebarItems = useMemo(
    () =>
      adminRoutes.map((route) => ({
        path: `/admin/${route.path}`,
        label: route.meta.label,
        iconKey: iconByKey[route.meta.icon] || 'dashboard',
      })),
    [],
  );

  const defaultLabel = sidebarItems[0]?.label ?? 'Bảng điều khiển';

  const activeItem = useMemo(
    () => sidebarItems.find((item) => location.pathname.startsWith(item.path)),
    [location.pathname, sidebarItems],
  );

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <AdminPageContext.Provider value={contextValue}>
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

        <div className={cx('admin-layout__main')}>
          <div className={cx('admin-layout__header')}>
            <AdminHeader onToggleSidebar={handleToggleSidebar} isOpen={isSidebarOpen} />
          </div>

          <AdminBodyContent
            pageTitle={activeItem?.label ?? defaultLabel}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
          >
            <Outlet />
          </AdminBodyContent>
        </div>
      </div>
    </AdminPageContext.Provider>
  );
}

export default AdminLayout;
