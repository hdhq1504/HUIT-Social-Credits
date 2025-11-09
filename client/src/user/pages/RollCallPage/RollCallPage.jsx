import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button, Empty, Input, Pagination, Select, Tabs } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CardActivity, Label } from '@components/index';
import useToast from '../../../components/Toast/Toast';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { fileToDataUrl } from '@utils/file';
import { ROUTE_PATHS } from '@/config/routes.config';
import useDebounce from '@/hooks/useDebounce';
import useInvalidateActivities from '@/hooks/useInvalidateActivities';
import faceRecognitionService from '@/services/faceRecognitionService';
import styles from './RollCallPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;
const PAGE_SIZE = 6;

function RollCallPage() {
  const { contextHolder, open: toast } = useToast();

  // ====== Search/Filter/Sort states ======
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const [sort, setSort] = useState('latest');
  const [pages, setPages] = useState({ ongoing: 1, upcoming: 1, ended: 1 });
  const debouncedQuery = useDebounce(q, 400);

  // Helpers
  const normalize = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const matchGroup = useCallback(
    (activity) => {
      if (group === 'all') return true;
      const groupKey = (activity?.pointGroup || '').toUpperCase();
      return groupKey === group;
    },
    [group],
  );

  const matchKeyword = useCallback(
    (activity) => {
      const key = debouncedQuery.trim();
      if (!key) return true;
      const haystack = normalize(
        [
          activity?.title,
          activity?.code,
          activity?.categoryName,
          activity?.groupName,
          activity?.location,
          activity?.description,
          activity?.pointGroup,
          activity?.pointGroupLabel,
        ].join(' '),
      );
      return haystack.includes(normalize(key));
    },
    [debouncedQuery],
  );

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

  const applySearch = useCallback(
    (items) => {
      const filtered = (items || []).filter(
        (reg) => reg?.activity && matchGroup(reg.activity) && matchKeyword(reg.activity),
      );
      return sortItems(filtered);
    },
    [matchGroup, matchKeyword, sortItems],
  );

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
      const message = error.response?.data?.error || 'Không thể điểm danh hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
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
    async ({ activity, dataUrl, file, phase }) => {
      if (!activity?.id) return;

      let evidenceDataUrl = dataUrl ?? null;
      if (!evidenceDataUrl && file) {
        try {
          evidenceDataUrl = await fileToDataUrl(file);
        } catch {
          toast({ message: 'Không thể đọc dữ liệu ảnh điểm danh. Vui lòng thử lại.', variant: 'danger' });
          throw new Error('ATTENDANCE_ABORTED');
        }
      }

      let facePayload;
      if (activity?.attendanceMethod === 'face') {
        if (!evidenceDataUrl) {
          toast({ message: 'Vui lòng chụp ảnh khuôn mặt rõ ràng để điểm danh.', variant: 'danger' });
          throw new Error('ATTENDANCE_ABORTED');
        }
        try {
          const descriptor = await faceRecognitionService.extractDescriptorFromDataUrl(evidenceDataUrl);
          facePayload = { descriptor };
        } catch (error) {
          const code = error?.message || '';
          const message =
            code === 'FACE_NOT_DETECTED'
              ? 'Không nhận diện được khuôn mặt trong ảnh. Vui lòng chụp lại với ánh sáng tốt hơn.'
              : 'Không thể xử lý ảnh khuôn mặt. Vui lòng thử lại.';
          toast({ message, variant: 'danger' });
          throw new Error('ATTENDANCE_ABORTED');
        }
      }

      return attendanceMutation.mutateAsync({
        id: activity.id,
        payload: {
          status: 'present',
          phase,
          evidence: evidenceDataUrl ? { data: evidenceDataUrl, mimeType: file?.type, fileName: file?.name } : undefined,
          face: facePayload,
        },
      });
    },
    [attendanceMutation, toast],
  );

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await feedbackMutation.mutateAsync({ id: activity.id, content, attachments });
    },
    [feedbackMutation],
  );

  // Phân loại theo state tab
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

  // UI list/empty (áp bộ lọc + sort)
  const ListOrEmpty = useCallback(
    ({ items, emptyText, tabKey }) => {
      const list = applySearch(items);
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
            {pageItems.map((registration) => (
              <CardActivity
                key={registration.id}
                {...registration.activity}
                variant="vertical"
                state={registration.activity?.state}
                onRegistered={handleRegister}
                onCancelRegister={handleCancel}
                onConfirmPresent={handleAttendance}
                onSendFeedback={handleFeedback}
                attendanceLoading={attendanceMutation.isPending}
              />
            ))}
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
      applySearch,
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
  }, [debouncedQuery, group, sort, registrations]);

  // Reset
  const handleReset = () => {
    setQ('');
    setGroup('all');
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
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onPressEnter={() => {}}
                    />

                    <Select value={group} size="large" className={cx('roll-call__search-select')} onChange={setGroup}>
                      <Option value="all">Tất cả nhóm điểm</Option>
                      <Option value="NHOM_1">Nhóm 1</Option>
                      <Option value="NHOM_2">Nhóm 2</Option>
                      <Option value="NHOM_3">Nhóm 3</Option>
                    </Select>

                    <Select value={sort} size="large" className={cx('roll-call__search-select')} onChange={setSort}>
                      <Option value="latest">Mới nhất</Option>
                      <Option value="oldest">Cũ nhất</Option>
                      <Option value="popular">Phổ biến nhất</Option>
                    </Select>

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
