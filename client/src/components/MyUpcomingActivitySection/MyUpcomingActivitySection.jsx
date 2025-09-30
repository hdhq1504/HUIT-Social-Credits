import React from 'react';
import { List } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faLocationDot, faCalendar, faSeedling, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import Label from '../Label/Label';
import styles from './MyUpcomingActivitySection.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const activities = [
  {
    title: 'Ngày hội hiến máu nhân đạo',
    datetime: '18/12/2024 - 8:30 AM',
    location: 'Hội trường C - HUIT',
    variant: 'orange',
    icon: faCalendar,
  },
  {
    title: 'Chiến dịch làm sạch bãi biển Vũng Tàu',
    datetime: '20/12/2024 - 6:00 AM',
    location: 'Bãi biển Thùy Vân',
    variant: 'yellow',
    icon: faSeedling,
  },
  {
    title: 'Dạy học cho trẻ em vùng cao Sapa',
    datetime: '25/12/2024 - 7:00 AM',
    location: 'Trường Tiểu học Sapa',
    variant: 'primary',
    icon: faGraduationCap,
  },
];

function MyUpcomingActivitySection() {
  return (
    <>
      <Label
        title="Hoạt động"
        highlight="sắp tới của bạn"
        subtitle="Bạn hãy thường xuyên kiểm tra để không bỏ lỡ nhé"
      />

      <List
        className={cx('container')}
        itemLayout="horizontal"
        dataSource={activities}
        renderItem={(activity, index) => (
          <List.Item key={activity.title} className={cx('item', { 'item--bordered': index !== activities.length - 1 })}>
            <List.Item.Meta
              avatar={
                <div className={cx('icon', `icon--${activity.variant}`)}>
                  <FontAwesomeIcon
                    icon={activity.icon}
                    className={cx('icon-shape', `icon-shape--${activity.variant}`)}
                  />
                </div>
              }
              title={<div className={cx('title')}>{activity.title}</div>}
              description={
                <div className={cx('meta')}>
                  <div className={cx('meta-group')}>
                    <FontAwesomeIcon icon={faClock} className={cx('meta-icon')} />
                    <span className={cx('meta-text')}>{activity.datetime}</span>
                  </div>
                  <div className={cx('meta-group')}>
                    <FontAwesomeIcon icon={faLocationDot} className={cx('meta-icon')} />
                    <span className={cx('meta-text')}>{activity.location}</span>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </>
  );
}

export default MyUpcomingActivitySection;
