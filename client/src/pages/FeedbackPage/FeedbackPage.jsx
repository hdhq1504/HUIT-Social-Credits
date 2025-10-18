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
import styles from './FeedbackPage.module.scss';

const cx = classNames.bind(styles);

function FeedbackPage() {
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

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await activitiesApi.feedback(activity.id, { content, attachments });
      await fetchActivities();
    },
    [fetchActivities],
  );

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

  const categorized = useMemo(() => {
    const all = registrations.filter((item) => Boolean(item.activity));
    const awarded = all.filter((item) => item.activity?.state === 'feedback_accepted');
    const submitted = all.filter((item) => item.activity?.state === 'feedback_reviewing');
    const denied = all.filter((item) => item.activity?.state === 'feedback_denied');
    return { all, awarded, submitted, denied };
  }, [registrations]);

  const buildCards = useCallback(
    (items) =>
      items.map((registration) => (
        <CardActivity
          key={registration.id}
          {...registration.activity}
          variant="vertical"
          state={registration.activity?.state}
          onSendFeedback={handleFeedback}
          onRegistered={handleRegister}
          onCancelRegister={handleCancel}
        />
      )),
    [handleFeedback, handleRegister, handleCancel],
  );

  const tabItems = useMemo(
    () => [
      {
        key: 'all',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Tất cả</span>
          </div>
        ),
        children: <div className={cx('feedback__list')}>{buildCards(categorized.all)}</div>,
      },
      {
        key: 'approved',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Đã được cộng điểm</span>
          </div>
        ),
        children: <div className={cx('feedback__list')}>{buildCards(categorized.awarded)}</div>,
      },
      {
        key: 'submitted',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Đã gửi phản hồi</span>
          </div>
        ),
        children: <div className={cx('feedback__list')}>{buildCards(categorized.submitted)}</div>,
      },
      {
        key: 'denied',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Từ chối</span>
          </div>
        ),
        children: <div className={cx('feedback__list')}>{buildCards(categorized.denied)}</div>,
      },
    ],
    [categorized, buildCards],
  );

  return (
    <section className={cx('feedback')}>
      {contextHolder}

      <div className={cx('feedback__container')}>
        {/* Header */}
        <header className={cx('feedback__header')}>
          <nav className={cx('feedback__breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Phản hồi</span>
          </nav>

          <Label title="Phản hồi" highlight="điểm" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        {/* Tabs */}
        <div className={cx('feedback__tabs')}>
          <Tabs
            defaultActiveKey="all"
            items={tabItems}
            type="line"
            size="large"
            tabBarGutter={12}
            renderTabBar={(props, DefaultTabBar) => (
              <>
                <DefaultTabBar {...props} />

                {/* Thanh tìm kiếm */}
                <div className={cx('feedback__search')}>
                  <Input placeholder="Nhập từ khóa" size="large" className={cx('feedback__search-input')} allowClear />

                  <Select defaultValue="all" size="large" className={cx('feedback__search-select')}>
                    <Select.Option value="all">Nhóm hoạt động</Select.Option>
                    <Select.Option value="mua-he-xanh">Mùa hè xanh</Select.Option>
                    <Select.Option value="hien-mau">Hiến máu</Select.Option>
                    <Select.Option value="dia-chi-do">Địa chỉ đỏ</Select.Option>
                  </Select>

                  <Select defaultValue="all" size="large" className={cx('feedback__search-select')}>
                    <Select.Option value="all">Mới nhất</Select.Option>
                    <Select.Option value="oldest">Cũ nhất</Select.Option>
                    <Select.Option value="popular">Phổ biến nhất</Select.Option>
                  </Select>

                  <Button
                    type="primary"
                    size="large"
                    className={cx('feedback__reset-button')}
                    icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                    onClick={fetchActivities}
                    loading={loading}
                  >
                    Đặt lại
                  </Button>
                </div>

                {/* Tiêu đề danh sách */}
                <div className={cx('feedback__title')}>Danh sách hoạt động</div>
              </>
            )}
          />
        </div>
      </div>
    </section>
  );
}

export default FeedbackPage;
