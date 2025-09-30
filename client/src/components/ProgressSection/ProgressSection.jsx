import React from 'react';
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
  imageUrl = 'https://placehold.co/320x320',
}) {
  return (
    <div className={cx('progress-section')}>
      <div className={cx('progress-wrapper')}>
        <div className={cx('progress-info')}>
          <div className={cx('progress-title')}>Tiến độ học tập của bạn</div>

          <div className={cx('progress-points')}>
            <div className={cx('points-block')}>
              <div className={cx('points-value')}>{currentPoints}</div>
              <div className={cx('points-label')}>Điểm hiện tại</div>
            </div>
            <div className={cx('points-block')}>
              <div className={cx('points-value', 'target')}>{targetPoints}</div>
              <div className={cx('points-label', 'target')}>Điểm mục tiêu</div>
            </div>
          </div>

          <div className={cx('progress-bar-section')}>
            <div className={cx('progress-bar-header')}>
              <span>Tiến độ tổng thể</span>
              <span>{percent}%</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor="#FFFFFF"
              trailColor="#FF5C00"
              strokeWidth={12}
              className={cx('progress-bar')}
            />
          </div>

          <div className={cx('progress-groups')}>
            {groups.map((g, idx) => (
              <div key={idx} className={cx('group-card', g.status)}>
                <div className={cx('group-header')}>
                  <span>{g.name}</span>
                  {g.status === 'success' ? (
                    <FontAwesomeIcon icon={faCircleCheck} className={cx('dot', 'success')} />
                  ) : (
                    <FontAwesomeIcon icon={faClock} className={cx('dot', 'warning')} />
                  )}
                </div>
                <div className={cx('group-value')}>{g.value}</div>
                <div className={cx('group-status')}>{g.note}</div>
              </div>
            ))}
          </div>

          <div className={cx('progress-summary')}>
            Bạn còn thiếu <strong>{missingPoints} điểm</strong> để đạt chứng chỉ hoàn thành.
          </div>

          <button className={cx('btn-detail')} onClick={onViewDetail}>
            Xem bảng điểm chi tiết
          </button>
        </div>

        <div className={cx('progress-image')}>
          <img src={imageUrl} alt="Progress" />
        </div>
      </div>
    </div>
  );
}

export default ProgressSection;
