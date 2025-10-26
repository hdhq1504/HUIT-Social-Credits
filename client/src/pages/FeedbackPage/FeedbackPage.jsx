import React, { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button, Input, Select, Tabs } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import styles from './FeedbackPage.module.scss';

const cx = classNames.bind(styles);

function FeedbackPage() {
  const { contextHolder, open: toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: registrations = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: MY_ACTIVITIES_QUERY_KEY,
    queryFn: () => activitiesApi.listMine(),
    staleTime: 30 * 1000,
    retry: 1,
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể tải danh sách hoạt động.';
      toast({ message, variant: 'danger' });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ id, note }) => activitiesApi.register(id, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason, note }) => activitiesApi.cancel(id, { reason, note }),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể hủy đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, content, attachments }) => activitiesApi.feedback(id, { content, attachments }),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
      toast({ message: 'Gửi phản hồi thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể gửi phản hồi. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await feedbackMutation.mutateAsync({ id: activity.id, content, attachments });
    },
    [feedbackMutation],
  );

  const handleRegister = useCallback(
    async ({ activity, note }) => {
      if (!activity?.id) return;
      await registerMutation.mutateAsync({ id: activity.id, note });
    },
    [registerMutation],
  );

  const handleCancel = useCallback(
    async ({ activity, reason, note }) => {
      if (!activity?.id) return;
      await cancelMutation.mutateAsync({ id: activity.id, reason, note });
    },
    [cancelMutation],
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
                    onClick={() => refetch()}
                    loading={isFetching}
                  >
                    Đặt lại
                  </Button>
                </div>

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
