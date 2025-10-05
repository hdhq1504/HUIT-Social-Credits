import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import Label from '@components/Label/Label';
import CardActivity from '@components/CardActivity/CardActivity';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from './FeaturedActivitySection.module.scss';
import { mockApi } from '../../utils/mockAPI';

const cx = classNames.bind(styles);

function FeaturedActivitySection() {
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
    <>
      <Label title="Hoạt động" highlight="nổi bật" subtitle="Những hoạt động được Ban quản lý đặc biệt giới thiệu" />

      <div className={cx('featured-activities')}>
        <div className={cx('featured-activities__slider')}>
          <Swiper
            modules={[Navigation, A11y]}
            slidesPerView={1}
            slidesPerGroup={1}
            navigation
            breakpoints={{
              640: { slidesPerView: 1.2, slidesPerGroup: 1, spaceBetween: 16 },
              768: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 16 },
              1024: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 20 },
              1280: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 20 },
            }}
          >
            {activities.map((a) => (
              <SwiperSlide key={a.id}>
                <CardActivity {...a} variant="vertical" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </>
  );
}

export default FeaturedActivitySection;
