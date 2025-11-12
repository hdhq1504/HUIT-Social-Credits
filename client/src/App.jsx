import { useEffect, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { publicRoutes, protectedUserRoutes } from './routes/userRoutes';
import { authRoutes } from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import ProtectedRoute from './components/guards/ProtectedRoute';
import GuestRoute from './components/guards/GuestRoute';
import NotFound from './components/NotFound/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AdminLayout from './admin/layouts/AdminLayout/AdminLayout';
import useAuthStore from './stores/useAuthStore';
import { ROUTE_PATHS } from './config/routes.config';

import ActivitiesAddEditPage from './admin/pages/ActivitiesAddEditPage/ActivitiesAddEditPage';
import ActivitiesDetailPage from './admin/pages/ActivitiesDetailPage/ActivitiesDetailPage';
import FeedbackDetailPage from './admin/pages/FeedbackDetailPage/FeedbackDetailPage';
import UsersAddEditPage from './admin/pages/UsersAddEditPage/UsersAddEditPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ConfigProvider locale={viVN}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ScrollToTop />
          <Routes>
            {authRoutes.map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={`auth-${index}`}
                  path={route.path}
                  element={
                    <GuestRoute>
                      <Page />
                    </GuestRoute>
                  }
                />
              );
            })}

            {publicRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = route.layout || Fragment;

              return (
                <Route
                  key={`public-${index}`}
                  path={route.path}
                  element={
                    <Layout>
                      <Page />
                    </Layout>
                  }
                />
              );
            })}

            {protectedUserRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = route.layout || Fragment;

              return (
                <Route
                  key={`user-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Page />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              );
            })}

            <Route
              path={ROUTE_PATHS.ADMIN.ROOT}
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to={ROUTE_PATHS.ADMIN.DASHBOARD} replace />} />

              {adminRoutes.map((route) => {
                const Page = route.component;
                return <Route key={route.path} path={route.path} element={<Page />} />;
              })}

              <Route path="activities/create" element={<ActivitiesAddEditPage />} />
              <Route path="activities/:id/edit" element={<ActivitiesAddEditPage />} />
              <Route path="activities/:id" element={<ActivitiesDetailPage />} />
              <Route path="feedback/:id" element={<FeedbackDetailPage />} />
              <Route path="users/create" element={<UsersAddEditPage />} />
              <Route path="users/:id/edit" element={<UsersAddEditPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
