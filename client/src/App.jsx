import React, { Fragment } from 'react';
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from './components/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AuthProvider from './context/AuthProvider';
import { publicRoutes } from './routes/routes';
import AdminLayout from '@admin/layouts/AdminLayout/AdminLayout.jsx';
import { DashboardPage, ActivitiesPage, ScoringPage, ProofPage } from '@admin/pages/index';

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

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="scoring" element={<ScoringPage />} />
            <Route path="proof" element={<ProofPage />} />
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
