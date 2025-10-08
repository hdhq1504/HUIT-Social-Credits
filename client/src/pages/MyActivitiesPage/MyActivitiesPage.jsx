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
import { Button, Calendar, Input, Select, Tabs, ConfigProvider } from 'antd';
import viVN from 'antd/es/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import updateLocale from 'dayjs/plugin/updateLocale';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import styles from './MyActivitiesPage.module.scss';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

dayjs.extend(updateLocale);
dayjs.locale('vi');
dayjs.updateLocale('vi', { weekStart: 1 });

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
        className={cx('my-activities__calendar-cell', {
          'my-activities__calendar-cell--in-view': isCurrentMonth,
          'my-activities__calendar-cell--has-event': Boolean(event),
          'my-activities__calendar-cell--primary': event?.type === 'primary',
          'my-activities__calendar-cell--warning': event?.type === 'warning',
          'my-activities__calendar-cell--success': event?.type === 'success',
        })}
      >
        <span className={cx('my-activities__calendar-date')}>{current.date()}</span>
      </div>
    );
  };

  const tabItems = useMemo(
    () => [
      {
        key: '1',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <FontAwesomeIcon icon={faCalendarCheck} className={cx('my-activities__tab-icon')} />
            <span>Đã đăng ký</span>
            <span className={cx('my-activities__tab-badge')}>12</span>
          </div>
        ),
        children: (
          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="registered" />
            ))}
          </div>
        ),
      },
      {
        key: '2',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <FontAwesomeIcon icon={faCircleCheck} className={cx('my-activities__tab-icon')} />
            <span>Đã tham gia</span>
            <span className={cx('my-activities__tab-badge')}>18</span>
          </div>
        ),
        children: (
          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="attendance_open" />
            ))}
          </div>
        ),
      },
      {
        key: '3',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <FontAwesomeIcon icon={faClock} className={cx('my-activities__tab-icon')} />
            <span>Đã hủy</span>
            <span className={cx('my-activities__tab-badge')}>3</span>
          </div>
        ),
        children: (
          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="canceled" />
            ))}
          </div>
        ),
      },
    ],
    [activities],
  );

  return (
    <ConfigProvider locale={viVN}>
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
            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--orange')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Điểm CTXH</div>
                  <div className={cx('my-activities__stat-card-value')}>156</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faTrophy} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>

            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--blue')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Tổng hoạt động</div>
                  <div className={cx('my-activities__stat-card-value')}>24</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faCalendarCheck} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>

            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--green')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Đã hoàn thành</div>
                  <div className={cx('my-activities__stat-card-value')}>18</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faCircleCheck} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>

            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--purple')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Đang chờ</div>
                  <div className={cx('my-activities__stat-card-value')}>3</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faClock} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className={cx('my-activities__calendar')}>
            <h3 className={cx('my-activities__calendar-title')}>Lịch hoạt động sắp tới</h3>
            <Calendar
              fullscreen={false}
              fullCellRender={fullCellRender}
              className={cx('my-activities__calendar-panel')}
            />

            {/* Legend */}
            <div className={cx('my-activities__legend')}>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--primary')} />
                <span>Hiến máu nhân đạo</span>
              </div>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--warning')} />
                <span>Mùa hè xanh</span>
              </div>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--success')} />
                <span>Địa chỉ đỏ</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={cx('my-activities__tabs')}>
            <Tabs
              defaultActiveKey="1"
              items={tabItems}
              type="line"
              size="large"
              tabBarGutter={12}
              renderTabBar={(props, DefaultTabBar) => (
                <>
                  <DefaultTabBar {...props} />

                  {/* Thanh tìm kiếm */}
                  <div className={cx('my-activities__search')}>
                    <Input
                      placeholder="Nhập từ khóa"
                      size="large"
                      className={cx('my-activities__search-input')}
                      allowClear
                    />

                    <Select defaultValue="all" size="large" className={cx('my-activities__search-select')}>
                      <Select.Option value="all">Nhóm hoạt động</Select.Option>
                      <Select.Option value="mua-he-xanh">Mùa hè xanh</Select.Option>
                      <Select.Option value="hien-mau">Hiến máu</Select.Option>
                      <Select.Option value="dia-chi-do">Địa chỉ đỏ</Select.Option>
                    </Select>

                    <Select defaultValue="all" size="large" className={cx('my-activities__search-select')}>
                      <Select.Option value="all">Mới nhất</Select.Option>
                      <Select.Option value="oldest">Cũ nhất</Select.Option>
                      <Select.Option value="popular">Phổ biến nhất</Select.Option>
                    </Select>

                    <Button
                      type="primary"
                      size="large"
                      className={cx('my-activities__reset-button')}
                      icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                    >
                      Đặt lại
                    </Button>
                  </div>

                  {/* Tiêu đề danh sách */}
                  <div className={cx('my-activities__title')}>Danh sách hoạt động</div>
                </>
              )}
            />
          </div>
        </div>
      </section>
    </ConfigProvider>
  );
}

export default MyActivitiesPage;
