import React, { useEffect, useMemo, useState } from 'react';
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
  isQualified = false,
  requirements = null,
}) {
  const [avatarSrc, setAvatarSrc] = useState(imageUrl || '/images/profile.png');

  useEffect(() => {
    setAvatarSrc(imageUrl || '/images/profile.png');
  }, [imageUrl]);

  const { displayPercent, progressPercent, safeMissingPoints } = useMemo(() => {
    const normalizedPercent = Number.isFinite(percent) ? percent : 0;
    const clampedPercent = Math.min(Math.max(normalizedPercent, 0), 100);
    const normalizedMissing = Number.isFinite(missingPoints) ? Math.max(missingPoints, 0) : 0;
    return {
      displayPercent: normalizedPercent,
      progressPercent: clampedPercent,
      safeMissingPoints: normalizedMissing,
    };
  }, [percent, missingPoints]);

  const summaryInfo = useMemo(() => {
    const groupOne = requirements?.groupOne;
    const groupTwoThree = requirements?.groupTwoThree;

    if (isQualified) {
      return {
        type: 'message',
        message: 'Bạn đã đủ điều kiện để nhận chứng chỉ công tác xã hội.',
      };
    }

    if (groupOne?.hasRequiredPoints && !groupOne?.hasRedAddressParticipation) {
      return {
        type: 'message',
        message: 'Bạn cần tham gia ít nhất một hoạt động Địa chỉ đỏ để hoàn thành chứng chỉ.',
      };
    }

    const needsGroupOnePoints = groupOne ? !groupOne.hasRequiredPoints : false;
    const needsGroupTwoThreePoints = groupTwoThree ? !groupTwoThree.hasRequiredPoints : false;

    if (needsGroupOnePoints || needsGroupTwoThreePoints) {
      return {
        type: 'points',
        missing: Math.max(Math.round(safeMissingPoints), 0),
      };
    }

    if (safeMissingPoints > 0) {
      return {
        type: 'points',
        missing: Math.max(Math.round(safeMissingPoints), 0),
      };
    }

    return {
      type: 'message',
      message: 'Bạn đã đạt đủ điểm số mục tiêu.',
    };
  }, [isQualified, requirements, safeMissingPoints]);

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
              <span>{displayPercent}%</span>
            </div>
            <Progress
              percent={progressPercent}
              showInfo={false}
              strokeColor="#FFFFFF"
              trailColor="#FF5C00"
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
            {summaryInfo.type === 'points' ? (
              <>
                Bạn còn thiếu <strong>{summaryInfo.missing}</strong> điểm để đạt chứng chỉ hoàn thành.
              </>
            ) : (
              summaryInfo.message
            )}
          </div>

          <div className={cx('progress-section__actions')} onClick={onViewDetail}>
            <Link to="/my-points" className={cx('progress-section__actions-link')}>
              Xem bảng điểm chi tiết
            </Link>
          </div>
        </div>

        <div className={cx('progress-section__image')}>
          <img src={avatarSrc} alt="Ảnh đại diện" onError={() => setAvatarSrc('/images/profile.png')} />
        </div>
      </div>
    </div>
  );
}

export default ProgressSection;
