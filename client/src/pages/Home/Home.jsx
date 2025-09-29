import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import SearchBar from '../../layouts/components/SearchBar';
import Label from '../../components/Label/Label';
import CardActivity from '../../components/CardActivity/CardActivity';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { mockApi } from '../../utils/mockAPI';

const cx = classNames.bind(styles);

function Home() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await mockApi.getActivities();
        setActivities(res);
      } catch (err) {
        console.error('Lỗi load activities:', err);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className={cx('wrapper')}>
      {/* Banner */}
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
          <SearchBar />
        </div>
      </div>

      {/* Content */}
      <div className={cx('content')}>
        <Label title="Hoạt động" highlight="nổi bật" subtitle="Những hoạt động được Ban quản lý đặc biệt giới thiệu" />

        {/* Slider */}
        <div className={cx('activity-slider')}>
          <Swiper
            modules={[Navigation, A11y]}
            spaceBetween={16}
            slidesPerView={1}
            slidesPerGroup={1}
            navigation
            loopFillGroupWithBlank={true}
            breakpoints={{
              640: { slidesPerView: 1.2, slidesPerGroup: 1, spaceBetween: 16 },
              768: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 16 },
              1024: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 20 },
              1280: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 24 },
            }}
          >
            {activities.map((a, idx) => (
              <SwiperSlide key={idx}>
                <CardActivity {...a} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}

export default Home;
