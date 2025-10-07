import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './NotFound.module.scss';

const cx = classNames.bind(styles);

function NotFound() {
  return (
    <main className={cx('not-found')}>
      <nav className={cx('not-found__breadcrumb')} aria-label="Đường dẫn">
        <ol className={cx('not-found__breadcrumb-list')}>
          <li className={cx('not-found__breadcrumb-item')}>
            <Link to="/">Trang chủ</Link>
          </li>
          <li className={cx('not-found__breadcrumb-item')} aria-current="page">
            Trang không tìm thấy
          </li>
        </ol>
      </nav>

      <section className={cx('not-found__content')}>
        <figure className={cx('not-found__figure')}>
          <img src="/images/404.svg" alt="Trang bạn tìm kiếm không tồn tại" className={cx('not-found__image')} />
        </figure>
        <Link to="/" className={cx('not-found__home-link')}>
          Trang chủ
          <img src="/images/Arrow_Right.svg" alt="" aria-hidden="true" className={cx('not-found__home-icon')} />
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
