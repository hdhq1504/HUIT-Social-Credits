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
import styles from './RollCallPage.module.scss';

const cx = classNames.bind(styles);

function RollCallPage() {
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
      toast({ message: 'Đăng ký hoạt động thành công!', variant: 'success' });
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
      toast({ message: 'Hủy đăng ký hoạt động thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể hủy đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: (id) => activitiesApi.attendance(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
      toast({ message: 'Điểm danh thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể điểm danh hoạt động. Vui lòng thử lại.';
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

  const handleAttendance = useCallback(
    async ({ activity }) => {
      if (!activity?.id) return;
      await attendanceMutation.mutateAsync(activity.id);
    },
    [attendanceMutation],
  );

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await feedbackMutation.mutateAsync({ id: activity.id, content, attachments });
    },
    [feedbackMutation],
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
                    onClick={() => refetch()}
                    loading={isFetching}
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
