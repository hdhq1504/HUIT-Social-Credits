import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button, Empty, Input, Pagination, Select, Tabs } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import styles from './FeedbackPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;
const PAGE_SIZE = 6;

function FeedbackPage() {
  const { contextHolder, open: toast } = useToast();
  const queryClient = useQueryClient();

  // ====== Search/Filter/Sort states ======
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const [sort, setSort] = useState('latest');
  const [pages, setPages] = useState({ all: 1, approved: 1, submitted: 1, denied: 1 });

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
      const map = {
        'mua-he-xanh': ['mùa hè xanh', 'mua he xanh'],
        'hien-mau': ['hiến máu', 'hien mau'],
        'dia-chi-do': ['địa chỉ đỏ', 'dia chi do'],
        'xuan-tinh-nguyen': ['xuân tình nguyện', 'xuan tinh nguyen'],
        'ho-tro': ['hỗ trợ', 'ho tro'],
      };
      const keys = map[group] || [];
      const haystack = normalize(
        [activity?.title, activity?.categoryName, activity?.groupName, activity?.description].join(' '),
      );
      return keys.some((k) => haystack.includes(k));
    },
    [group],
  );

  const matchKeyword = useCallback(
    (activity) => {
      const key = q.trim();
      if (!key) return true;
      const haystack = normalize(
        [
          activity?.title,
          activity?.code,
          activity?.categoryName,
          activity?.groupName,
          activity?.location,
          activity?.description,
        ].join(' '),
      );
      return haystack.includes(normalize(key));
    },
    [q],
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

  // Phân loại theo trạng thái phản hồi
  const categorized = useMemo(() => {
    const all = registrations.filter((item) => Boolean(item.activity));
    const awarded = all.filter((item) => item.activity?.state === 'feedback_accepted');
    const submitted = all.filter((item) => item.activity?.state === 'feedback_reviewing');
    const denied = all.filter((item) => item.activity?.state === 'feedback_denied');
    return { all, awarded, submitted, denied };
  }, [registrations]);

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
          <div className={cx('feedback__empty')}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={isFetching ? 'Đang tải dữ liệu…' : emptyText || 'Không có hoạt động nào'}
            />
          </div>
        );
      }

      return (
        <>
          <div className={cx('feedback__list')}>
            {pageItems.map((registration) => (
              <CardActivity
                key={registration.id}
                {...registration.activity}
                variant="vertical"
                state={registration.activity?.state}
                onSendFeedback={handleFeedback}
                onRegistered={handleRegister}
                onCancelRegister={handleCancel}
              />
            ))}
          </div>
          <Pagination
            className={cx('feedback__pagination')}
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
    [applySearch, handleFeedback, handleRegister, handleCancel, isFetching, pages, handlePageChange],
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
        children: <ListOrEmpty tabKey="all" emptyText="Chưa có hoạt động nào" />,
      },
      {
        key: 'approved',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Đã được cộng điểm</span>
          </div>
        ),
        children: (
          <ListOrEmpty tabKey="approved" items={categorized.awarded} emptyText="Chưa có hoạt động được cộng điểm" />
        ),
      },
      {
        key: 'submitted',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Đã gửi phản hồi</span>
          </div>
        ),
        children: (
          <ListOrEmpty tabKey="submitted" items={categorized.submitted} emptyText="Chưa có phản hồi nào được gửi" />
        ),
      },
      {
        key: 'denied',
        label: (
          <div className={cx('feedback__tab-label')}>
            <span>Từ chối</span>
          </div>
        ),
        children: (
          <ListOrEmpty tabKey="denied" items={categorized.denied} emptyText="Chưa có phản hồi nào bị từ chối" />
        ),
      },
    ],
    [categorized],
  );

  useEffect(() => {
    setPages({ all: 1, approved: 1, submitted: 1, denied: 1 });
  }, [q, group, sort, registrations]);

  const handleReset = () => {
    setQ('');
    setGroup('all');
    setSort('latest');
    refetch();
  };

  return (
    <section className={cx('feedback')}>
      {contextHolder}

      <div className={cx('feedback__container')}>
        <header className={cx('feedback__header')}>
          <nav className={cx('feedback__breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Phản hồi</span>
          </nav>
          <Label title="Phản hồi" highlight="điểm" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        <div className={cx('feedback__tabs')}>
          <Tabs
            defaultActiveKey="all"
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
                  <div className={cx('feedback__search')}>
                    <Input
                      placeholder="Nhập từ khóa"
                      size="large"
                      className={cx('feedback__search-input')}
                      allowClear
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onPressEnter={() => {}}
                    />

                    <Select value={group} size="large" className={cx('feedback__search-select')} onChange={setGroup}>
                      <Option value="all">Nhóm hoạt động</Option>
                      <Option value="mua-he-xanh">Mùa hè xanh</Option>
                      <Option value="hien-mau">Hiến máu</Option>
                      <Option value="dia-chi-do">Địa chỉ đỏ</Option>
                      <Option value="xuan-tinh-nguyen">Xuân tình nguyện</Option>
                      <Option value="ho-tro">Hỗ trợ</Option>
                    </Select>

                    <Select value={sort} size="large" className={cx('feedback__search-select')} onChange={setSort}>
                      <Option value="latest">Mới nhất</Option>
                      <Option value="oldest">Cũ nhất</Option>
                      <Option value="popular">Phổ biến nhất</Option>
                    </Select>

                    <Button
                      type="primary"
                      size="large"
                      className={cx('feedback__reset-button')}
                      icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                      onClick={handleReset}
                      loading={isFetching}
                    >
                      Đặt lại
                    </Button>
                  </div>

                  <div className={cx('feedback__title')}>Danh sách hoạt động</div>
                </>
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default FeedbackPage;
