import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import TeacherHeader from '../TeacherHeader/TeacherHeader';
import TeacherSidebar from '../TeacherSidebar/TeacherSidebar';
import TeacherBodyContent from '../TeacherBodyContent/TeacherBodyContent';
import { TeacherPageContext } from '@/teacher/contexts/TeacherPageContext';
import teacherRoutes from '@/routes/teacherRoutes';
import { ROUTE_PATHS } from '@/config/routes.config';
import useAuthStore from '@/stores/useAuthStore';
import { authApi } from '@/api/auth.api';
import useToast from '@/components/Toast/Toast';
import styles from './TeacherLayout.module.scss';
import { faChalkboardUser } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function TeacherLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [pageActions, setPageActions] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(null);
  const authUser = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.logout);
  const { contextHolder, open: openToast } = useToast();
  const contextValue = useMemo(() => ({ setPageActions, setBreadcrumbs }), []);

  useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
  });

  const sidebarItems = useMemo(
    () =>
      teacherRoutes
        .filter((route) => !route.meta?.hideInSidebar)
        .map((route) => ({
          path: `/teacher/${route.path}`,
          label: route.meta?.label ?? 'Trang',
          icon: route.meta?.icon ?? faChalkboardUser,
          iconKey: route.meta?.iconKey, // If you add iconKey to teacherRoutes later
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

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearSession();
      openToast({ message: 'Đã đăng xuất khỏi hệ thống.', variant: 'success' });
      navigate(ROUTE_PATHS.PUBLIC.LOGIN);
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Đăng xuất thất bại, vui lòng thử lại.', variant: 'danger' });
    },
  });

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const headerUser = useMemo(
    () => ({
      name: authUser?.fullName || authUser?.hoTen || 'Giảng viên',
      email: authUser?.email || 'teacher@huit.edu.vn',
      avatarUrl: authUser?.avatarUrl || '',
    }),
    [authUser],
  );

  return (
    <TeacherPageContext.Provider value={contextValue}>
      {contextHolder}
      <div className={cx('teacher-layout')}>
        <div
          className={`${cx('teacher-layout__sidebar')} ${
            isSidebarOpen ? cx('teacher-layout__sidebar--open') : cx('teacher-layout__sidebar--closed')
          }`}
        >
          <TeacherSidebar
            items={sidebarItems}
            activePath={activeItem?.path ?? ''}
            isOpen={isSidebarOpen}
            onNavigate={handleNavigate}
          />
        </div>

        <div className={cx('teacher-layout__main')}>
          <div className={cx('teacher-layout__header')}>
            <TeacherHeader
              onToggleSidebar={handleToggleSidebar}
              isOpen={isSidebarOpen}
              user={headerUser}
              onLogout={handleLogout}
            />
          </div>

          <TeacherBodyContent
            pageTitle={activeItem?.label ?? defaultLabel}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
          >
            <Outlet />
          </TeacherBodyContent>
        </div>
      </div>
    </TeacherPageContext.Provider>
  );
}

export default TeacherLayout;
