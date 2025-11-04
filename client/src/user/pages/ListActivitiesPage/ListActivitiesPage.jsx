import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  ConfigProvider,
  Row,
  Col,
  Typography,
  Select,
  Pagination,
  Drawer,
  Button as AntButton,
  Grid,
  Empty,
} from 'antd';
import { CardActivity, CheckboxGroup } from '@components/index';
import SearchBar from '../../../user/layouts/SearchBar/SearchBar';
import styles from './ListActivitiesPage.module.scss';
import activitiesApi from '@api/activities.api';
// ⬇️ Bỏ import lọc theo state đăng ký để hiển thị tất cả
// import { isUnregisteredOrParticipated } from '@utils/activityState';

const cx = classNames.bind(styles);
const { Text } = Typography;
const PAGE_SIZE = 10;

function ListActivitiesPage() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Search/filter states
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const options = [
    { value: 'Tất cả', label: 'Tất cả' },
    { value: 'Địa chỉ đỏ', label: 'Địa chỉ đỏ' },
    { value: 'Mùa hè xanh', label: 'Mùa hè xanh' },
    { value: 'Xuân tình nguyện', label: 'Xuân tình nguyện' },
    { value: 'Hiến máu', label: 'Hiến máu' },
    { value: 'Hỗ trợ', label: 'Hỗ trợ' },
  ];

  const screens = Grid.useBreakpoint();

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const res = await activitiesApi.list();
        setActivities(res);
      } catch (err) {
        console.error('Lỗi load activities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQuery(p.get('q') || '');
  }, [location.search]);

  // Helpers
  const normalize = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const normalizedSelectedCategories = useMemo(() => {
    if (!selectedItems.length || selectedItems.includes('Tất cả')) return [];
    return selectedItems.map((value) => normalize(value));
  }, [selectedItems]);

  const computeStatus = (a) => {
    const now = Date.now();
    const start = a.startTime ? new Date(a.startTime).getTime() : null;
    const end = a.endTime ? new Date(a.endTime).getTime() : null;
    if (start && now < start) return 'upcoming';
    if (start && end && now >= start && now <= end) return 'ongoing';
    if (end && now > end) return 'ended';
    return 'upcoming';
  };

  const groupMatches = useCallback(
    (a) => {
      if (filterGroup === 'all') return true;
      const groupKey =
        {
          'mua-he-xanh': ['mùa hè xanh', 'mua he xanh'],
          'hien-mau': ['hiến máu', 'hien mau'],
          'dia-chi-do': ['địa chỉ đỏ', 'dia chi do'],
          'ho-tro': ['hỗ trợ', 'ho tro'],
          'xuan-tinh-nguyen': ['xuân tình nguyện', 'xuan tinh nguyen'],
        }[filterGroup] || [];
      const haystack = normalize([a.title, a.code, a.categoryName, a.description].join(' '));
      return groupKey.some((k) => haystack.includes(k));
    },
    [filterGroup],
  );

  const statusMatches = useCallback(
    (a) => {
      if (filterStatus === 'all') return true;
      return computeStatus(a) === filterStatus;
    },
    [filterStatus],
  );

  const keywordMatches = useCallback(
    (a) => {
      if (!query.trim()) return true;
      const q = normalize(query);
      const haystack = normalize([a.title, a.code, a.categoryName, a.description, a.location].join(' '));
      return haystack.includes(q);
    },
    [query],
  );

  const visibleActivities = useMemo(() => {
    let result = [...activities];

    const matchesSelectedCategories = (a) => {
      if (!normalizedSelectedCategories.length) return true;
      const categoryText = normalize([a.category, a.categoryName].filter(Boolean).join(' '));
      return normalizedSelectedCategories.some((category) => categoryText.includes(category));
    };

    result = result.filter(
      (a) => keywordMatches(a) && groupMatches(a) && statusMatches(a) && matchesSelectedCategories(a),
    );

    if (sortBy === 'latest') {
      result = result.sort((a, b) => {
        const ta = new Date(a.createdAt || a.startTime || 0).getTime();
        const tb = new Date(b.createdAt || b.startTime || 0).getTime();
        return tb - ta;
      });
    } else if (sortBy === 'points_desc') {
      result = result.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (sortBy === 'points_asc') {
      result = result.sort((a, b) => (a.points || 0) - (b.points || 0));
    }

    return result;
  }, [activities, groupMatches, keywordMatches, normalizedSelectedCategories, sortBy, statusMatches]);

  const unregisteredActivities = useMemo(
    () =>
      visibleActivities.filter((activity) => {
        const stateValue = activity?.state || 'guest';
        return stateValue === 'guest' || stateValue === 'ended';
      }),
    [visibleActivities],
  );

  const totalActivities = unregisteredActivities.length;
  const totalPages = totalActivities ? Math.ceil(totalActivities / PAGE_SIZE) : 0;
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const paginatedActivities = useMemo(() => {
    if (!totalActivities) return [];
    const start = (safePage - 1) * PAGE_SIZE;
    return unregisteredActivities.slice(start, start + PAGE_SIZE);
  }, [safePage, totalActivities, unregisteredActivities]);

  const resultsCount = loading ? '--' : totalActivities;

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filterGroup, filterStatus, query, selectedItems]);

  const handleSearchSubmit = (q) => {
    setCurrentPage(1);
    setQuery(q);
    const search = q ? `?q=${encodeURIComponent(q)}` : '';
    navigate(`/list-activities${search}`, { replace: true });
  };

  const handleFilterChange = ({ group, status }) => {
    if (group !== undefined) setFilterGroup(group);
    if (status !== undefined) setFilterStatus(status);
    setCurrentPage(1);
  };

  return (
    <section className={cx('activities-page')}>
      <header className={cx('activities-page__search')}>
        <SearchBar variant="list" onSubmit={handleSearchSubmit} onFilterChange={handleFilterChange} />
      </header>

      <div className={cx('activities-page__container')}>
        <nav className={cx('activities-page__breadcrumb')} aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> /{' '}
          <span>
            {sortBy === 'latest'
              ? 'Sắp xếp ngày đăng gần nhất'
              : sortBy === 'points_desc'
                ? 'Điểm cao → thấp'
                : 'Điểm thấp → cao'}
          </span>
        </nav>

        <div className={cx('activities-page__layout')}>
          <Row gutter={[24, 24]}>
            {/* Content 9/12 */}
            <Col xs={24} lg={18}>
              <section className={cx('activities-page__results')} aria-label="Kết quả hoạt động">
                <header className={cx('activities-page__results-header')}>
                  <div className={cx('activities-page__results-count')}>
                    <span className={cx('activities-page__results-count-text')}>
                      Có <span className={cx('activities-page__results-count-number')}>{resultsCount}</span> kết quả phù
                      hợp
                      {query ? (
                        <>
                          {' '}
                          cho từ khóa "<span>{query}</span>"
                        </>
                      ) : null}
                    </span>
                  </div>

                  <div className={cx('activities-page__filter')}>
                    <div className={cx('activities-page__sort')}>
                      <Text className={cx('activities-page__sort-label')}>Sắp xếp theo</Text>
                      <Select
                        size="middle"
                        value={sortBy}
                        onChange={setSortBy}
                        className={cx('activities-page__sort-select')}
                        options={[
                          { value: 'latest', label: 'Ngày đăng gần nhất' },
                          { value: 'points_desc', label: 'Điểm cao → thấp' },
                          { value: 'points_asc', label: 'Điểm thấp → cao' },
                        ]}
                      />
                    </div>
                    <AntButton
                      onClick={() => setDrawerOpen(true)}
                      size="medium"
                      className={cx('activities-page__filter-button')}
                    >
                      Bộ lọc
                    </AntButton>
                  </div>
                </header>

                <div className={cx('activities-page__cards')}>
                  {loading
                    ? Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <CardActivity
                          key={`activity-skeleton-${index}`}
                          loading
                          variant={screens.md ? 'horizontal' : 'vertical'}
                        />
                      ))
                    : paginatedActivities.map((activity) => (
                        <CardActivity
                          key={activity.id}
                          {...activity}
                          variant={screens.md ? 'horizontal' : 'vertical'}
                          state={activity.state || 'guest'}
                          onRegistered={async ({ activity: current, note }) => {
                            try {
                              const updated = await activitiesApi.register(current.id, note ? { note } : {});
                              setActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                            } catch (error) {
                              console.error('Register failed', error);
                              throw error;
                            }
                          }}
                          onCancelRegister={async ({ activity: current, reason, note }) => {
                            try {
                              const updated = await activitiesApi.cancel(current.id, { reason, note });
                              setActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                            } catch (error) {
                              console.error('Cancel registration failed', error);
                              throw error;
                            }
                          }}
                        />
                      ))}

                  {!loading && !paginatedActivities.length && (
                    <div className={cx('activities-page__empty-state')}>
                      <Empty description="Không có hoạt động phù hợp" />
                    </div>
                  )}
                </div>

                {!loading && totalActivities > 0 && (
                  <footer className={cx('activities-page__pagination')}>
                    <ConfigProvider
                      theme={{
                        token: {
                          colorPrimary: '#FFFFFF',
                          fontFamily: 'Montserrat',
                        },
                        components: {
                          Pagination: {
                            itemActiveBg: '#FF5C00',
                          },
                        },
                      }}
                    >
                      <Pagination
                        current={safePage}
                        pageSize={PAGE_SIZE}
                        total={totalActivities}
                        onChange={(page) => setCurrentPage(page)}
                        showSizeChanger={false}
                        hideOnSinglePage
                      />
                    </ConfigProvider>
                  </footer>
                )}
              </section>
            </Col>

            {/* Sidebar 3/12 - Desktop only */}
            <Col xs={0} lg={6}>
              <aside className={cx('activities-page__filters')} aria-label="Bộ lọc hoạt động">
                <CheckboxGroup selectedValues={selectedItems} onChange={setSelectedItems} options={options} />
              </aside>
            </Col>
          </Row>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={null}
        placement="bottom"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={320}
        closeIcon={null}
        className={cx('activities-page__drawer')}
        styles={{
          body: { padding: 0 },
        }}
      >
        <CheckboxGroup
          selectedValues={selectedItems}
          onChange={setSelectedItems}
          options={options}
          showCloseButton
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>
    </section>
  );
}

export default ListActivitiesPage;
