import React from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import SearchBar from '../../layouts/components/SearchBar';
import CardActivity from '../../components/CardActivity/CardActivity';

const cx = classNames.bind(styles);

function Home() {
  return (
    <div className={cx('wrapper')}>
      <div className={cx('banner')}>
        <div className={cx('banner-content')}>
          <h1 className={cx('banner-title')}>
            TÌM KIẾM VÀ TRA CỨU ĐIỂM CÔNG TÁC XÃ HỘI
            <br />
            TẠI <span className={cx('highlight')}>HUIT SOCIAL CREDITS</span>
          </h1>
          <p className={cx('banner-subtitle')}>Trang web chính thức của Trường Đại học Công thương TP. Hồ Chí Minh</p>
        </div>
        <div className={cx('banner-search')}>
          <div>
            <SearchBar />
          </div>
        </div>
      </div>

      <div className={cx('content')}>
        <CardActivity />
      </div>
    </div>
  );
}

export default Home;
