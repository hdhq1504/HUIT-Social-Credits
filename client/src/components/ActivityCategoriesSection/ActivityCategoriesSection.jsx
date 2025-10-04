import React from 'react';
import classNames from 'classnames/bind';
import Label from '@components/Label/Label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faLeaf, faTint, faSeedling, faHandshakeAngle } from '@fortawesome/free-solid-svg-icons';
import styles from './ActivityCategoriesSection.module.scss';

const cx = classNames.bind(styles);

function ActivityCategoriesSection() {
  return (
    <>
      <Label
        title="Các hạng mục"
        highlight="hoạt động"
        subtitle="Khám phá các loại hoạt động cộng tác xã hội phong phú và đa dạng"
      />

      <div className={cx('activity-categories')}>
        <div className={cx('activity-categories__list')}>
          <div className={cx('activity-categories__item', 'activity-categories__item--red')}>
            <div className={cx('activity-categories__icon')}>
              <FontAwesomeIcon icon={faHeart} />
            </div>
            <div className={cx('activity-categories__title')}>Địa chỉ đỏ</div>
            <div className={cx('activity-categories__subtitle')}>Hoạt động bắt buộc</div>
            <div className={cx('activity-categories__count')}>15 hoạt động</div>
          </div>

          <div className={cx('activity-categories__item', 'activity-categories__item--green')}>
            <div className={cx('activity-categories__icon')}>
              <FontAwesomeIcon icon={faLeaf} />
            </div>
            <div className={cx('activity-categories__title')}>Mùa hè xanh</div>
            <div className={cx('activity-categories__subtitle')}>Bảo vệ môi trường</div>
            <div className={cx('activity-categories__count')}>8 hoạt động</div>
          </div>

          <div className={cx('activity-categories__item', 'activity-categories__item--blood')}>
            <div className={cx('activity-categories__icon')}>
              <FontAwesomeIcon icon={faTint} />
            </div>
            <div className={cx('activity-categories__title')}>Hiến máu</div>
            <div className={cx('activity-categories__subtitle')}>Cứu người, cứu đời</div>
            <div className={cx('activity-categories__count')}>3 hoạt động</div>
          </div>

          <div className={cx('activity-categories__item', 'activity-categories__item--spring')}>
            <div className={cx('activity-categories__icon')}>
              <FontAwesomeIcon icon={faSeedling} />
            </div>
            <div className={cx('activity-categories__title')}>Xuân tình nguyện</div>
            <div className={cx('activity-categories__subtitle')}>Hoạt động mùa xuân</div>
            <div className={cx('activity-categories__count')}>6 hoạt động</div>
          </div>

          <div className={cx('activity-categories__item', 'activity-categories__item--support')}>
            <div className={cx('activity-categories__icon')}>
              <FontAwesomeIcon icon={faHandshakeAngle} />
            </div>
            <div className={cx('activity-categories__title')}>Hỗ trợ</div>
            <div className={cx('activity-categories__subtitle')}>Hỗ trợ cộng đồng</div>
            <div className={cx('activity-categories__count')}>12 hoạt động</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ActivityCategoriesSection;
