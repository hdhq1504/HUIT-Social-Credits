import React, { Fragment } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from './components/NotFound';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AuthProvider from './context/AuthProvider';
import DefaultLayout from './layouts/DefaultLayout/DefaultLayout';
import { publicRoutes } from './routes/routes';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider />
        <Routes>
          {publicRoutes.map((route, index) => {
            const Page = route.component;

            let Layout = DefaultLayout;

            if (route.layout) {
              Layout = route.layout;
            } else if (route.layout === null) {
              Layout = Fragment;
            }

            return (
              <Route
                key={index}
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
            path="*"
            element={
              <DefaultLayout>
                <NotFound />
              </DefaultLayout>
            }
          />
        </Routes>

        <div>
          <ScrollToTop />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
