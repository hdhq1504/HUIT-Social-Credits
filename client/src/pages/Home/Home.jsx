import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import SearchBar from '../../layouts/components/SearchBar';

const cx = classNames.bind(styles);

function Home() {
  return (
    <div className={cx('wrapper')}>
      <div className={cx('banner')}>
        <div className={cx('banner-content')}>
          <h1 className={cx('banner-title')}>
            TÌM KIẾM TÀI LIỆU VÀ TẠO BÀI KIỂM TRA
            <br />
            TẠI <span className={cx('highlight')}>HUIT E-LEARN</span>
          </h1>
          <p className={cx('banner-subtitle')}>Trang web chính thức của trường Đại học Công thương TP. Hồ Chí Minh</p>
        </div>
        <div className={cx('banner-search')}>
          <div>
            <SearchBar />
          </div>
        </div>
      </div>

      <div className={cx('content')}></div>
    </div>
  );
}

export default Home;
