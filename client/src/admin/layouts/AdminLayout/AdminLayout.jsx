import React, { useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminHeader from '../AdminHeader/AdminHeader';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import AdminBodyContent from '../AdminBodyContent/AdminBodyContent';
import styles from './AdminLayout.module.scss';
import adminRoutes from '@/routes/adminRoutes';

const cx = classNames.bind(styles);

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems = useMemo(
    () =>
      adminRoutes.map((route) => ({
        path: `/admin/${route.path}`,
        label: route.label,
        icon: route.icon,
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

        <AdminBodyContent pageTitle={activeItem?.label ?? defaultLabel}>
          <Outlet />
        </AdminBodyContent>
      </div>
    </div>
  );
}

export default AdminLayout;
