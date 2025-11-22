import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button, Empty, Input, Pagination, Select, Tabs } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CardActivity, Label, useToast } from '@components/index';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { fileToDataUrl } from '@utils/file';
import { computeDescriptorFromDataUrl } from '@/services/faceApiService';
import { ROUTE_PATHS } from '@/config/routes.config';
import useInvalidateActivities from '@/hooks/useInvalidateActivities';
import useRegistrationFilters from '@/hooks/useRegistrationFilters';
import uploadService from '@/services/uploadService';
import useAuthStore from '@/stores/useAuthStore';
import styles from './RollCallPage.module.scss';

const cx = classNames.bind(styles);
const PAGE_SIZE = 6;

function RollCallPage() {
  const { contextHolder, open: toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  // ====== Search/Filter/Sort states ======
  const [sort, setSort] = useState('latest');
  const [pages, setPages] = useState({ ongoing: 1, upcoming: 1, ended: 1 });

  const handlePageChange = useCallback((tabKey, page) => {
    setPages((prev) => ({ ...prev, [tabKey]: page }));
  }, []);

  // ====== Data ======
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

  const {
    keyword,
    setKeyword,
    semester,
    setSemester,
    semesters,
    filtered: filteredRegistrations,
    resetFilters,
  } = useRegistrationFilters(registrations, {
    enableSemester: true,
  });

  const sortItems = useCallback(
    (arr) => {
      const items = [...arr];
      if (sort === 'latest') {
        items.sort((a, b) => {
          const ta = new Date(a.activity?.updatedAt || a.activity?.startTime || 0).getTime();
          const tb = new Date(b.activity?.updatedAt || b.activity?.startTime || 0).getTime();
          return tb - ta;
        });
      } else if (sort === 'oldest') {
        items.sort((a, b) => {
          const ta = new Date(a.activity?.updatedAt || a.activity?.startTime || 0).getTime();
          const tb = new Date(b.activity?.updatedAt || b.activity?.startTime || 0).getTime();
          return ta - tb;
        });
      } else if (sort === 'popular') {
        items.sort((a, b) => (b.activity?.registeredCount || 0) - (a.activity?.registeredCount || 0));
      }
      return items;
    },
    [sort],
  );

  const processedRegistrations = useMemo(
    () => sortItems(filteredRegistrations.filter((registration) => Boolean(registration?.activity))),
    [filteredRegistrations, sortItems],
  );

  const invalidateActivityQueries = useInvalidateActivities();

  const registerMutation = useMutation({
    mutationFn: ({ id, note }) => activitiesApi.register(id, { note }),
    onSuccess: async () => {
      await invalidateActivityQueries();
      toast({ message: 'Đăng ký hoạt động thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason, note }) => activitiesApi.cancel(id, { reason, note }),
    onSuccess: async () => {
      await invalidateActivityQueries();
      toast({ message: 'Hủy đăng ký hoạt động thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể hủy đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ id, payload }) => activitiesApi.attendance(id, payload),
    onSuccess: async (data) => {
      await invalidateActivityQueries();
      return data;
    },
    onError: (error) => {
      const rawMessage = error.response?.data?.error;
      const message =
        typeof rawMessage === 'string' && rawMessage.trim()
          ? rawMessage.trim()
          : 'Không thể điểm danh hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
      if (error && typeof error === 'object') {
        try {
          Object.defineProperty(error, 'handledByToast', { value: true, configurable: true, writable: true });
        } catch {
          // ignore
        }
      }
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, content, attachments }) => activitiesApi.feedback(id, { content, attachments }),
    onSuccess: async () => {
      await invalidateActivityQueries();
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
    async ({ activity, dataUrl, file, phase, faceDescriptor, faceError }) => {
      if (!activity?.id) return;

      let evidenceDataUrl = dataUrl ?? null;
      if (!evidenceDataUrl && file) {
        try {
          evidenceDataUrl = await fileToDataUrl(file);
        } catch (error) {
          console.error('[RollCallPage] Không convert file -> dataURL:', error);
          toast({
            message: 'Không thể đọc file ảnh. Vui lòng thử lại.',
            variant: 'danger',
          });
          throw new Error('ATTENDANCE_ABORTED');
        }
      }

      const isPhotoAttendance = activity?.attendanceMethod === 'photo';
      let descriptorPayload = null;
      let faceErrorPayload = faceError ?? null;

      if (isPhotoAttendance) {
        if (faceDescriptor && typeof faceDescriptor === 'object') {
          try {
            descriptorPayload = Array.from(faceDescriptor);
          } catch {
            descriptorPayload = Array.isArray(faceDescriptor) ? faceDescriptor : null;
          }
        }

        if (!descriptorPayload && !faceErrorPayload && evidenceDataUrl) {
          try {
            const computedDescriptor = await computeDescriptorFromDataUrl(evidenceDataUrl);
            if (computedDescriptor?.length) {
              descriptorPayload = computedDescriptor;
            } else {
              faceErrorPayload = 'NO_FACE_DETECTED';
            }
          } catch (err) {
            console.error('[RollCallPage] Lỗi phân tích khuôn mặt:', err);
            faceErrorPayload = 'ANALYSIS_FAILED';
          }
        }

        if (!descriptorPayload?.length) {
          const msg =
            faceErrorPayload === 'ANALYSIS_FAILED'
              ? 'Không thể phân tích khuôn mặt. Vui lòng chụp lại.'
              : 'Không nhận diện được khuôn mặt. Vui lòng chụp lại.';
          toast({ message: msg, variant: 'danger' });
          throw new Error('ATTENDANCE_ABORTED');
        }

        console.debug('[RollCallPage] Chuẩn bị gửi điểm danh với descriptor khuôn mặt.', {
          descriptorLength: descriptorPayload.length,
        });
      }

      return attendanceMutation.mutateAsync({
        id: activity.id,
        payload: {
          status: 'present',
          phase,
          evidence: evidenceDataUrl
            ? {
                data: evidenceDataUrl,
                mimeType: file?.type || 'image/jpeg',
                fileName: file?.name || `attendance_${Date.now()}.jpg`,
              }
            : undefined,
          faceDescriptor,
          faceError,
        },
      });
    },
    [attendanceMutation, toast],
  );

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      try {
        const attachments = await uploadService.uploadMultipleFeedbackEvidence(files || [], {
          userId,
          activityId: activity.id,
        });
        await feedbackMutation.mutateAsync({ id: activity.id, content, attachments });
      } catch (error) {
        const message = error?.message || 'Không thể tải minh chứng. Vui lòng thử lại.';
        toast({ message, variant: 'danger' });
      }
    },
    [feedbackMutation, toast, userId],
  );

  const categorized = useMemo(() => {
    const groups = { ongoing: [], upcoming: [], ended: [] };
    processedRegistrations.forEach((registration) => {
      const activity = registration.activity;
      if (!activity) return;
      switch (activity.state) {
        case 'check_in':
        case 'check_out':
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
  }, [processedRegistrations]);

  const ListOrEmpty = useCallback(
    ({ items, emptyText, tabKey }) => {
      const list = Array.isArray(items) ? items : [];
      const total = list.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const current = Math.max(1, Math.min(pages[tabKey] ?? 1, totalPages));
      const start = (current - 1) * PAGE_SIZE;
      const pageItems = list.slice(start, start + PAGE_SIZE);

      if (!total) {
        return (
          <div className={cx('roll-call__empty')}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={isFetching ? 'Đang tải dữ liệu…' : emptyText || 'Không có hoạt động nào'}
            />
          </div>
        );
      }

      return (
        <>
          <div className={cx('roll-call__list')}>
            {pageItems.map((registration) => {
              const activityState = registration.activity?.state;
              const registrationStatus = registration.status;
              const feedbackStatus = registration.feedback?.status;

              let effectiveState = activityState;

              if (registrationStatus === 'DA_THAM_GIA') {
                if (activityState === 'feedback_accepted' || feedbackStatus === 'DA_DUYET') {
                  effectiveState = 'feedback_accepted';
                } else if (
                  activityState !== 'feedback_reviewing' &&
                  activityState !== 'feedback_denied' &&
                  activityState !== 'feedback_pending'
                ) {
                  effectiveState = 'completed';
                }
              }

              return (
                <CardActivity
                  key={registration.id}
                  {...registration.activity}
                  variant="vertical"
                  state={effectiveState}
                  registration={registration}
                  requiresFaceEnrollment={registration.activity?.requiresFaceEnrollment}
                  faceEnrollment={registration.activity?.faceEnrollment}
                  onRegistered={handleRegister}
                  onCancelRegister={handleCancel}
                  onConfirmPresent={handleAttendance}
                  onSendFeedback={handleFeedback}
                  attendanceLoading={attendanceMutation.isPending}
                />
              );
            })}
          </div>
          <Pagination
            className={cx('roll-call__pagination')}
            current={current}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={(page) => handlePageChange(tabKey, page)}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </>
      );
    },
    [
      handleRegister,
      handleCancel,
      handleAttendance,
      handleFeedback,
      isFetching,
      attendanceMutation.isPending,
      pages,
      handlePageChange,
    ],
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
        children: (
          <ListOrEmpty tabKey="ongoing" items={categorized.ongoing} emptyText="Chưa có hoạt động đang diễn ra" />
        ),
      },
      {
        key: 'upcoming',
        label: (
          <div className={cx('roll-call__tab-label')}>
            <span>Sắp diễn ra</span>
          </div>
        ),
        children: (
          <ListOrEmpty tabKey="upcoming" items={categorized.upcoming} emptyText="Chưa có hoạt động sắp diễn ra" />
        ),
      },
      {
        key: 'ended',
        label: (
          <div className={cx('roll-call__tab-label')}>
            <span>Đã kết thúc</span>
          </div>
        ),
        children: <ListOrEmpty tabKey="ended" items={categorized.ended} emptyText="Chưa có hoạt động đã kết thúc" />,
      },
    ],
    [categorized],
  );

  useEffect(() => {
    setPages({ ongoing: 1, upcoming: 1, ended: 1 });
  }, [filteredRegistrations, semester, sort]);

  // Reset
  const handleReset = () => {
    resetFilters();
    setSort('latest');
    refetch();
  };

  return (
    <section className={cx('roll-call')}>
      {contextHolder}

      <div className={cx('roll-call__container')}>
        <header className={cx('roll-call__header')}>
          <nav className={cx('roll-call__header-breadcrumb')} aria-label="Breadcrumb">
            <Link to={ROUTE_PATHS.PUBLIC.HOME}>Trang chủ</Link> / <span>Điểm danh</span>
          </nav>
          <Label title="Điểm danh" highlight="hoạt động" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        <div className={cx('roll-call__tabs')}>
          <Tabs
            defaultActiveKey="ongoing"
            items={tabItems}
            type="line"
            size="large"
            tabBarGutter={12}
            renderTabBar={(props, TabBar) => {
              const RenderedTabBar = TabBar;
              return (
                <>
                  <RenderedTabBar {...props} />

                  {/* Thanh tìm kiếm */}
                  <div className={cx('roll-call__search')}>
                    <Input
                      placeholder="Nhập từ khóa"
                      size="large"
                      className={cx('roll-call__search-input')}
                      allowClear
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onPressEnter={() => {}}
                    />

                    <Select
                      value={semester}
                      size="large"
                      className={cx('roll-call__search-select')}
                      onChange={setSemester}
                      options={[
                        { value: 'all', label: 'Tất cả học kỳ' },
                        ...semesters.map((value) => ({ value, label: value })),
                      ]}
                    />

                    <Select
                      value={sort}
                      size="large"
                      className={cx('roll-call__search-select')}
                      onChange={setSort}
                      options={[
                        { value: 'latest', label: 'Mới nhất' },
                        { value: 'oldest', label: 'Cũ nhất' },
                        { value: 'popular', label: 'Phổ biến nhất' },
                      ]}
                    />

                    <Button
                      type="primary"
                      size="large"
                      className={cx('roll-call__reset-button')}
                      icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                      onClick={handleReset}
                      loading={isFetching}
                    >
                      Đặt lại
                    </Button>
                  </div>

                  <div className={cx('roll-call__title')}>Danh sách hoạt động</div>
                </>
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default RollCallPage;
