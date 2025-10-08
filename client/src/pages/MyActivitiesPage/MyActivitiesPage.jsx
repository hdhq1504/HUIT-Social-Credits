import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faCalendarCheck,
  faCircleCheck,
  faClock,
  faArrowRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { Button, Calendar, Input, Select, Tabs } from 'antd';
import dayjs from 'dayjs';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import styles from './MyActivitiesPage.module.scss';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

const EVENT_MAP = {
  '2025-10-15': { type: 'primary', label: 'Hiến máu nhân đạo' },
  '2025-10-25': { type: 'warning', label: 'Mùa hè xanh' },
  '2025-10-30': { type: 'success', label: 'Địa chỉ đỏ' },
};

function MyActivitiesPage() {
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

  const fullCellRender = (current, info) => {
    const key = dayjs(current).format('YYYY-MM-DD');
    const event = EVENT_MAP[key];
    const isCurrentMonth = info.originNode?.props?.className?.includes('ant-picker-cell-in-view');

    return (
      <div
        className={cx(
          'calendar__cell',
          isCurrentMonth && 'calendar__cell--in-view',
          event && 'calendar__cell--has',
          event?.type === 'primary' && 'calendar__cell--primary',
          event?.type === 'warning' && 'calendar__cell--warning',
          event?.type === 'success' && 'calendar__cell--success',
        )}
      >
        <span className={cx('calendar__date')}>{current.date()}</span>
      </div>
    );
  };

  const tabItems = useMemo(
    () => [
      {
        key: '1',
        label: (
          <div className={cx('tab-label')}>
            <FontAwesomeIcon icon={faCalendarCheck} className={cx('tab-icon')} />
            <span>Đã đăng ký</span>
            <span className={cx('tab-badge')}>12</span>
          </div>
        ),
        children: '',
      },
      {
        key: '2',
        label: (
          <div className={cx('tab-label')}>
            <FontAwesomeIcon icon={faCircleCheck} className={cx('tab-icon')} />
            <span>Đã tham gia</span>
            <span className={cx('tab-badge')}>18</span>
          </div>
        ),
        children: '',
      },
      {
        key: '3',
        label: (
          <div className={cx('tab-label')}>
            <FontAwesomeIcon icon={faClock} className={cx('tab-icon')} />
            <span>Đã hủy</span>
            <span className={cx('tab-badge')}>3</span>
          </div>
        ),
        children: '',
      },
    ],
    [],
  );

  return (
    <section className={cx('my-activities')}>
      <div className={cx('my-activities__container')}>
        {/* Header */}
        <header className={cx('my-activities__header')}>
          <nav className={cx('my-activities__header-breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Hoạt động của tôi</span>
          </nav>

          <Label title="Hoạt động" highlight="của tôi" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        {/* Stats */}
        <div className={cx('my-activities__stats')}>
          <div className={`${cx('stat-card')} ${cx('stat-card--orange')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Điểm CTXH</div>
                <div className={cx('stat-card__value')}>156</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faTrophy} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>

          <div className={`${cx('stat-card')} ${cx('stat-card--blue')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Tổng hoạt động</div>
                <div className={cx('stat-card__value')}>24</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faCalendarCheck} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>

          <div className={`${cx('stat-card')} ${cx('stat-card--green')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Đã hoàn thành</div>
                <div className={cx('stat-card__value')}>18</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faCircleCheck} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>

          <div className={`${cx('stat-card')} ${cx('stat-card--purple')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Đang chờ</div>
                <div className={cx('stat-card__value')}>3</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faClock} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className={cx('my-activities__calendar')}>
          <div className={cx('calendar__title')}>Lịch hoạt động sắp tới</div>
          <Calendar fullscreen={false} fullCellRender={fullCellRender} className={cx('calendar')} />

          {/* Legend */}
          <div className={cx('calendar__legend')}>
            <div className={cx('legend__item')}>
              <span className={cx('legend__dot', 'legend__dot--primary')} />
              <span>Hiến máu nhân đạo</span>
            </div>
            <div className={cx('legend__item')}>
              <span className={cx('legend__dot', 'legend__dot--warning')} />
              <span>Mùa hè xanh</span>
            </div>
            <div className={cx('legend__item')}>
              <span className={cx('legend__dot', 'legend__dot--success')} />
              <span>Địa chỉ đỏ</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={cx('my-activities__tabs')}>
          <Tabs defaultActiveKey="1" items={tabItems} type="line" size="large" tabBarGutter={12} />

          <div className={cx('my-activities__search')}>
            <Input placeholder="Nhập từ khóa" size="large" className={cx('search-input')} allowClear />

            <Select defaultValue="all" size="large" className={cx('search-select')}>
              <Select.Option value="all">Nhóm hoạt động</Select.Option>
              <Select.Option value="mua-he-xanh">Mùa hè xanh</Select.Option>
              <Select.Option value="hien-mau">Hiến máu</Select.Option>
              <Select.Option value="dia-chi-do">Địa chỉ đỏ</Select.Option>
            </Select>

            <Select defaultValue="all" size="large" className={cx('search-select')}>
              <Select.Option value="all">Mới nhất</Select.Option>
              <Select.Option value="oldest">Cũ nhất</Select.Option>
              <Select.Option value="popular">Phổ biến nhất</Select.Option>
            </Select>

            <Button
              type="primary"
              size="large"
              className={cx('reset-button')}
              icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
              onClick={() => console.log('Reset clicked')}
            >
              Đặt lại
            </Button>
          </div>

          <div className={cx('my-activities__title')}>Danh sách hoạt động</div>

          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="completed" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyActivitiesPage;
