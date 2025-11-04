import React, { Fragment } from 'react';
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from './components/NotFound/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AuthProvider from './context/AuthProvider';
import AdminRoute from './components/AdminRoute/AdminRoute';
import { publicRoutes } from './routes/routes';
import adminRoutes from './routes/adminRoutes';
import AdminLayout from '@admin/layouts/AdminLayout/AdminLayout.jsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider />

        <Routes>
          {publicRoutes.map((route, index) => {
            const Page = route.component;
            const Layout = route.layout ?? Fragment;

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

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            {adminRoutes.map((route) => {
              const Page = route.component;
              return <Route key={route.path} path={route.path} element={<Page />} />;
            })}
          </Route>

          <Route
            path="*"
            element={
              <Fragment>
                <NotFound />
              </Fragment>
            }
          />
        </Routes>

        <div>
          <ScrollToTop />
        </div>
        <ScrollToTop />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
