import React from 'react';
import classNames from 'classnames/bind';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import styles from './CardActivity.module.scss';

const cx = classNames.bind(styles);

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'U';
}

function CardActivity({
  title,
  points,
  dateTime,
  location,
  participants = [],
  capacity,
  coverImage,
  isFeatured,
  onRegister,
  onDetails,
}) {
  return (
    <div className={cx('card')}>
      <div className={cx('card-cover')} style={{ backgroundImage: `url(${coverImage})` }}>
        {isFeatured && <div className={cx('card-badge')}>Nổi bật</div>}
      </div>

      <div className={cx('card-content')}>
        <div className={cx('card-title')}>{title}</div>

        <div className={cx('card-points')}>
          <FontAwesomeIcon icon={faCoins} />
          <span className={cx('card-points-value')}>{points} điểm</span>
        </div>
        <div className={cx('card-date')}>
          <FontAwesomeIcon icon={faCalendar} />
          <span className={cx('card-date-value')}>{dateTime}</span>
        </div>
        <div className={cx('card-location')}>
          <FontAwesomeIcon icon={faLocationDot} />
          <span className={cx('card-location-value')}>{location}</span>
        </div>

        <div className={cx('card-participants')}>
          <Avatar.Group
            max={{
              count: 3,
              style: { color: '#f56a00', backgroundColor: '#fde3cf' },
            }}
          >
            {participants.map((p, idx) => {
              if (typeof p === 'string') {
                return <Avatar key={idx} src={p} alt="participant" />;
              }
              const { name, src } = p || {};
              return (
                <Tooltip key={idx} title={name} placement="top">
                  {src ? (
                    <Avatar src={src} alt={name} />
                  ) : name ? (
                    <Avatar>{getInitials(name)}</Avatar>
                  ) : (
                    <Avatar icon={<UserOutlined />} />
                  )}
                </Tooltip>
              );
            })}
          </Avatar.Group>

          <span className={cx('card-capacity')}>Số lượng: {capacity}</span>
        </div>

        <div className={cx('card-actions')}>
          <button className={cx('btn-outline')} onClick={onDetails}>
            Chi tiết
          </button>
          <button className={cx('btn-primary')} onClick={onRegister}>
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardActivity;
