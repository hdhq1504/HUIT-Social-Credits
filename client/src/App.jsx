import React, { Fragment } from 'react';
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import NotFound from './components/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AuthProvider from './context/AuthProvider';

// Import routes
import { publicRoutes } from './routes/routes';

// Import layout và các trang admin
import AdminLayout from './layouts/Admin/AdminLayout/AdminLayout.jsx';
import DashboardPage from './pages/Admin/DashboardPage/DashboardPage';
import ActivitiesPage from './pages/Admin/ActivitiesPage/ActivitiesPage';
import ScoringPage from './pages/Admin/ScoringPage/ScoringPage';
import ProofPage from './pages/Admin/ProofPage/ProofPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Provider cho xác thực */}
        <AuthProvider />

        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
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

          {/* ================= ADMIN ROUTES ================= */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="scoring" element={<ScoringPage />} />
            <Route path="proof" element={<ProofPage />} />
          </Route>

          {/* ================= 404 NOT FOUND ================= */}
          <Route
            path="*"
            element={
              <Fragment>
                <NotFound />
              </Fragment>
            }
          />
        </Routes>

        <ScrollToTop />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
