import React, { Fragment } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import NotFound from './components/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AuthProvider from './context/AuthProvider';

import { publicRoutes, adminRoutes } from './routes/routes';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider />

        <Routes>
          {/* Public routes */}
          {publicRoutes.map((route, index) => {
            const Page = route.component;
            let Layout = route.layout ?? Fragment;

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

          {/* Admin routes */}
          {adminRoutes.map((route, index) => {
            const Page = route.component;
            let Layout = route.layout ?? Fragment;

            return (
              <Route
                key={`admin-${index}`}
                path={route.path}
                element={
                  <Layout>
                    <Page />
                  </Layout>
                }
              />
            );
          })}

          {/* Route 404 */}
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
