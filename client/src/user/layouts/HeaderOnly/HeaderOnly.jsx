import React from 'react';
import classNames from 'classnames/bind';
import Header from '../Header/Header';
import styles from './HeaderOnly.module.scss';

const cx = classNames.bind(styles);

function HeaderOnly({ children }) {
  return (
    <div className={cx('layout-header-only')}>
      <Header />
      <main className={cx('layout-header-only__content')}>{children}</main>
    </div>
  );
}

export default HeaderOnly;
