import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ConfigProvider, Row, Col, Typography, Select, Pagination, Drawer, Button as AntButton, Grid } from 'antd';
import CardActivity from '@components/CardActivity/CardActivity';
import CheckboxGroup from '@components/CheckboxGroup/CheckboxGroup';
import SearchBar from '@layouts/SearchBar/SearchBar';
import styles from './ListActivitiesPage.module.scss';
import activitiesApi from '@api/activities.api';
// ⬇️ Bỏ import lọc theo state đăng ký để hiển thị tất cả
// import { isUnregisteredOrParticipated } from '@utils/activityState';

const cx = classNames.bind(styles);
const { Text } = Typography;

function ListActivitiesPage() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activities, setActivities] = useState([]);

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
      try {
        const res = await activitiesApi.list();
        setActivities(res);
      } catch (err) {
        console.error('Lỗi load activities:', err);
      }
    };
    fetchActivities();
  }, []);

  // Đồng bộ ô tìm kiếm khi query string thay đổi (nếu cần)
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

  const computeStatus = (a) => {
    const now = Date.now();
    const start = a.startTime ? new Date(a.startTime).getTime() : null;
    const end = a.endTime ? new Date(a.endTime).getTime() : null;
    if (start && now < start) return 'upcoming';
    if (start && end && now >= start && now <= end) return 'ongoing';
    if (end && now > end) return 'ended';
    return 'upcoming';
  };

  const groupMatches = (a) => {
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
  };

  const statusMatches = (a) => {
    if (filterStatus === 'all') return true;
    return computeStatus(a) === filterStatus;
  };

  const keywordMatches = (a) => {
    if (!query.trim()) return true;
    const q = normalize(query);
    const haystack = normalize([a.title, a.code, a.categoryName, a.description, a.location].join(' '));
    return haystack.includes(q);
  };

  const visibleActivities = useMemo(() => {
    // ⬇️ Hiển thị TẤT CẢ hoạt động rồi mới áp bộ lọc & sắp xếp
    let result = [...activities];

    result = result.filter((a) => keywordMatches(a) && groupMatches(a) && statusMatches(a));

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
  }, [activities, query, filterGroup, filterStatus, sortBy]);

  const handleSearchSubmit = (q) => {
    setQuery(q);
    const search = q ? `?q=${encodeURIComponent(q)}` : '';
    navigate(`/list-activities${search}`, { replace: true });
  };

  const handleFilterChange = ({ group, status }) => {
    if (group !== undefined) setFilterGroup(group);
    if (status !== undefined) setFilterStatus(status);
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
                      Có <span className={cx('activities-page__results-count-number')}>{visibleActivities.length}</span>{' '}
                      kết quả phù hợp
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
                  {visibleActivities.map((activity) => (
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
                </div>

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
                    {/* ⬇️ Dùng đúng tổng số kết quả */}
                    <Pagination defaultCurrent={1} total={visibleActivities.length} showSizeChanger={false} />
                  </ConfigProvider>
                </footer>
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
