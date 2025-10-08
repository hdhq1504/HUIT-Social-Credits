import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Progress } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import styles from './ProgressSection.module.scss';

const cx = classNames.bind(styles);

function ProgressSection({
  currentPoints = 0,
  targetPoints = 100,
  percent = 0,
  groups = [],
  missingPoints = 0,
  onViewDetail,
  imageUrl = '/images/profile.png',
}) {
  return (
    <div className={cx('progress-section')}>
      <div className={cx('progress-section__wrapper')}>
        <div className={cx('progress-section__info')}>
          <div className={cx('progress-section__title')}>Tiến độ học tập của bạn</div>

          <div className={cx('progress-section__points')}>
            <div className={cx('progress-section__points-item')}>
              <div className={cx('progress-section__points-value')}>{currentPoints}</div>
              <div className={cx('progress-section__points-label')}>Điểm hiện tại</div>
            </div>
            <div className={cx('progress-section__points-item')}>
              <div className={cx('progress-section__points-value', 'progress-section__points-value--target')}>
                {targetPoints}
              </div>
              <div className={cx('progress-section__points-label', 'progress-section__points-value--target')}>
                Điểm mục tiêu
              </div>
            </div>
          </div>

          <div className={cx('progress-section__progress')}>
            <div className={cx('progress-section__progress-header')}>
              <span>Tiến độ tổng thể</span>
              <span>{percent}%</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor="#FFFFFF"
              trailColor="#FF5C00"
              strokeWidth={12}
              className={cx('progress-section__bar')}
            />
          </div>

          <div className={cx('progress-section__group')}>
            {groups.map((g, idx) => (
              <div
                key={idx}
                className={cx('progress-section__group-card', `progress-section__group-card--${g.status}`)}
              >
                <div className={cx('progress-section__group-header')}>
                  <span>{g.name}</span>
                  {g.status === 'success' ? (
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className={cx('progress-section__group-icon', 'progress-section__group-icon--success')}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faClock}
                      className={cx('progress-section__group-icon', 'progress-section__group-icon--warning')}
                    />
                  )}
                </div>
                <div className={cx('progress-section__group-value')}>{g.value}</div>
                <div className={cx('progress-section__group-status')}>{g.note}</div>
              </div>
            ))}
          </div>

          <div className={cx('progress-section__summary')}>
            Bạn còn thiếu <strong>{missingPoints} điểm</strong> để đạt chứng chỉ hoàn thành.
          </div>

          <div className={cx('progress-section__actions')} onClick={onViewDetail}>
            <Link to="/my-points" className={cx('progress-section__actions-link')}>
              Xem bảng điểm chi tiết
            </Link>
          </div>
        </div>

        <div className={cx('progress-section__image')}>
          <img src={imageUrl} alt="Progress" />
        </div>
      </div>
    </div>
  );
}

export default ProgressSection;
