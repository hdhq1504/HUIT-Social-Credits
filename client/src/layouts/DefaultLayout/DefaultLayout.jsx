import React from 'react';
import classNames from 'classnames/bind';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import styles from './DefaultLayout.module.scss';

const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
  return (
    <div className={cx('layout-default')}>
      <Header />
      <main className={cx('layout-default__content')}>{children}</main>
      <Footer />
    </div>
  );
}

export default DefaultLayout;
