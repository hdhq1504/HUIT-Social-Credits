import React, { Fragment } from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import NotFound from './components/NotFound';
import DefaultLayout from './layouts/DefaultLayout/DefaultLayout';
import { store } from './redux/store';
import { publicRoutes } from './routes/routes';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import AuthProvider from './context/AuthProvider';

function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;
