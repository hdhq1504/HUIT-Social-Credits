import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Button from '../Button/Button';
import RegisterModal from '../RegisterModal/RegisterModal';
import routes from '../../config/routes';
import styles from './CardActivity.module.scss';

const cx = classNames.bind(styles);

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'U';
}

function CardActivity({
  id,
  title,
  points,
  dateTime,
  location,
  participants = [],
  capacity,
  coverImage = 'https://placehold.co/240x215',
  isFeatured = false,
  variant = 'vertical',
  badgeText = 'Nổi bật',
  onDetails,
  onRegister,
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const rootClass = cx('activity-card', {
    'activity-card--vertical': variant === 'vertical',
    'activity-card--horizontal': variant === 'horizontal',
    'activity-card--featured': !!isFeatured,
  });

  const activity = {
    id,
    title,
    points,
    dateTime,
    location,
    participants,
    capacity,
    coverImage,
    isFeatured,
  };

  const handleOpenDetail = () => {
    if (typeof onDetails === 'function') {
      onDetails(activity);
      return;
    }
    if (id) {
      navigate(routes.activityDetailWithId.replace(':id', id));
    } else {
      console.warn('Activity không có id:', activity);
    }
  };

  const handleOpenRegister = () => {
    if (typeof onRegister === 'function') {
      onRegister(activity);
    }
    setOpen(true);
  };

  const handleConfirm = () => {
    // TODO: gọi API đăng ký thật (nếu có)
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  return (
    <div className={rootClass}>
      <div className={cx('activity-card__cover')} style={{ backgroundImage: `url(${coverImage})` }} aria-label={title}>
        {isFeatured && (
          <div className={cx('activity-card__badge')} data-label={badgeText}>
            {badgeText}
          </div>
        )}
        <div className={cx('activity-card__cover-layer')} />
      </div>

      <div className={cx('activity-card__content')}>
        <div className={cx('activity-card__title')}>{title}</div>

        <div className={cx('activity-card__points')}>
          <FontAwesomeIcon icon={faCoins} />
          <span className={cx('activity-card__points-value')}>{points != null ? `${points} điểm` : '--'}</span>
        </div>

        <div className={cx('activity-card__date')}>
          <FontAwesomeIcon icon={faCalendar} />
          <span className={cx('activity-card__date-value')}>{dateTime || '--'}</span>
        </div>

        <div className={cx('activity-card__location')}>
          <FontAwesomeIcon icon={faLocationDot} />
          <span className={cx('activity-card__location-value')}>{location || '--'}</span>
        </div>

        <div className={cx('activity-card__participants')}>
          <Avatar.Group
            max={{
              count: 3,
              style: { color: '#F56A00', backgroundColor: '#FDE3CF' },
            }}
          >
            {participants.map((p, idx) => {
              if (typeof p === 'string') return <Avatar key={idx} src={p} alt="participant" />;
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

          <span className={cx('activity-card__capacity')}>Số lượng: {capacity || '--'}</span>
        </div>

        <div className={cx('activity-card__actions')}>
          <Button variant="outline" onClick={handleOpenDetail}>
            Chi tiết
          </Button>
          <Button variant="primary" onClick={handleOpenRegister}>
            Đăng ký ngay
          </Button>
        </div>
      </div>

      <RegisterModal
        open={open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        variant="confirm"
        campaignName={title || 'Hoạt động'}
        pointsLabel={points != null ? `${points} điểm` : undefined}
        dateTime={dateTime}
        location={location}
      />
    </div>
  );
}

export default CardActivity;
