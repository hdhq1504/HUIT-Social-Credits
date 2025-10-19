import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button, Input, Select, Tabs } from 'antd';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import activitiesApi from '@api/activities.api';
import styles from './RollCallPage.module.scss';

const cx = classNames.bind(styles);

function RollCallPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { contextHolder, open: toast } = useToast();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activitiesApi.listMine();
      setRegistrations(data);
    } catch (error) {
      const message = error.response?.data?.error || 'Không thể tải danh sách hoạt động.';
      toast({ message, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRegister = useCallback(
    async ({ activity, note }) => {
      if (!activity?.id) return;
      await activitiesApi.register(activity.id, { note });
      await fetchActivities();
    },
    [fetchActivities],
  );

  const handleCancel = useCallback(
    async ({ activity, reason, note }) => {
      if (!activity?.id) return;
      await activitiesApi.cancel(activity.id, { reason, note });
      await fetchActivities();
    },
    [fetchActivities],
  );

  const handleAttendance = useCallback(
    async ({ activity }) => {
      if (!activity?.id) return;
      await activitiesApi.attendance(activity.id, {});
      await fetchActivities();
    },
    [fetchActivities],
  );

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await activitiesApi.feedback(activity.id, { content, attachments });
      await fetchActivities();
    },
    [fetchActivities],
  );

  const categorized = useMemo(() => {
    const groups = { ongoing: [], upcoming: [], ended: [] };
    registrations.forEach((registration) => {
      const activity = registration.activity;
      if (!activity) return;
      switch (activity.state) {
        case 'attendance_open':
        case 'confirm_in':
          groups.ongoing.push(registration);
          break;
        case 'registered':
        case 'attendance_closed':
          groups.upcoming.push(registration);
          break;
        default:
          groups.ended.push(registration);
      }
    });
    return groups;
  }, [registrations]);

  const buildCards = useCallback(
    (items) =>
      items.map((registration) => (
        <CardActivity
          key={registration.id}
          {...registration.activity}
          variant="vertical"
          state={registration.activity?.state}
          onRegistered={handleRegister}
          onCancelRegister={handleCancel}
          onConfirmPresent={handleAttendance}
          onSendFeedback={handleFeedback}
        />
      )),
    [handleRegister, handleCancel, handleAttendance, handleFeedback],
  );

  const tabItems = useMemo(
    () => [
      {
        key: 'ongoing',
        label: (
          <div className={cx('roll-call__tab-label')}>
            <span>Đang diễn ra</span>
          </div>
        ),
        children: <div className={cx('roll-call__list')}>{buildCards(categorized.ongoing)}</div>,
      },
      {
        key: 'upcoming',
        label: (
          <div className={cx('roll-call__tab-label')}>
            <span>Sắp diễn ra</span>
          </div>
        ),
        children: <div className={cx('roll-call__list')}>{buildCards(categorized.upcoming)}</div>,
      },
      {
        key: 'ended',
        label: (
          <div className={cx('roll-call__tab-label')}>
            <span>Đã kết thúc</span>
          </div>
        ),
        children: <div className={cx('roll-call__list')}>{buildCards(categorized.ended)}</div>,
      },
    ],
    [categorized, buildCards],
  );

  return (
    <section className={cx('roll-call')}>
      {contextHolder}

      <div className={cx('roll-call__container')}>
        {/* Header */}
        <header className={cx('roll-call__header')}>
          <nav className={cx('roll-call__header-breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Điểm danh</span>
          </nav>

          <Label title="Điểm danh" highlight="hoạt động" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        {/* Tabs */}
        <div className={cx('roll-call__tabs')}>
          <Tabs
            defaultActiveKey="ongoing"
            items={tabItems}
            type="line"
            size="large"
            tabBarGutter={12}
            renderTabBar={(props, DefaultTabBar) => (
              <>
                <DefaultTabBar {...props} />

                {/* Thanh tìm kiếm */}
                <div className={cx('roll-call__search')}>
                  <Input placeholder="Nhập từ khóa" size="large" className={cx('roll-call__search-input')} allowClear />

                  <Select defaultValue="all" size="large" className={cx('roll-call__search-select')}>
                    <Select.Option value="all">Nhóm hoạt động</Select.Option>
                    <Select.Option value="mua-he-xanh">Mùa hè xanh</Select.Option>
                    <Select.Option value="hien-mau">Hiến máu</Select.Option>
                    <Select.Option value="dia-chi-do">Địa chỉ đỏ</Select.Option>
                  </Select>

                  <Select defaultValue="all" size="large" className={cx('roll-call__search-select')}>
                    <Select.Option value="all">Mới nhất</Select.Option>
                    <Select.Option value="oldest">Cũ nhất</Select.Option>
                    <Select.Option value="popular">Phổ biến nhất</Select.Option>
                  </Select>

                  <Button
                    type="primary"
                    size="large"
                    className={cx('roll-call__reset-button')}
                    icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                    onClick={fetchActivities}
                    loading={loading}
                  >
                    Đặt lại
                  </Button>
                </div>

                <div className={cx('roll-call__title')}>Danh sách hoạt động</div>
              </>
            )}
          />
        </div>
      </div>
    </section>
  );
}

export default RollCallPage;
