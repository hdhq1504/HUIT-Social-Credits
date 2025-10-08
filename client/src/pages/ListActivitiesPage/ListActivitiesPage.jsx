import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ConfigProvider, Row, Col, Typography, Select, Pagination, Drawer, Button as AntButton, Grid } from 'antd';
import CardActivity from '@components/CardActivity/CardActivity';
import CheckboxGroup from '@components/CheckboxGroup/CheckboxGroup';
import SearchBar from '@layouts/components/SearchBar/SearchBar';
import styles from './ListActivitiesPage.module.scss';
import { mockApi } from '../../utils/mockAPI';

const cx = classNames.bind(styles);

const { Title, Text } = Typography;

function ListActivitiesPage() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const options = [
    { value: 'Tất cả', label: 'Tất cả' },
    { value: 'Địa chỉ đỏ', label: 'Địa chỉ đỏ' },
    { value: 'Mùa hè xanh', label: 'Mùa hè xanh' },
    { value: 'Xuân tình nguyện', label: 'Xuân tình nguyện' },
    { value: 'Hiến máu', label: 'Hiến máu' },
    { value: 'Hỗ trợ', label: 'Hỗ trợ' },
  ];
  const [activities, setActivities] = useState([]);
  const screens = Grid.useBreakpoint();

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

  return (
    <section className={cx('activities-page')}>
      <header className={cx('activities-page__search')}>
        <SearchBar variant="list" onSubmit={(query) => console.log('List filter search:', query)} />
      </header>

      <div className={cx('activities-page__container')}>
        <nav className={cx('activities-page__breadcrumb')} aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> /{' '}
          <span>Sắp xếp ngày đăng gần nhất</span>
        </nav>

        <div className={cx('acitivities-page__layout')}>
          <Row gutter={[24, 24]}>
            {/* Content 9/12 */}
            <Col xs={24} lg={18}>
              <section className={cx('activities-page__results')} aria-label="Kết quả hoạt động">
                <header className={cx('activities-page__results-header')}>
                  <div className={cx('activities-page__results-count')}>
                    <Title level={5} className={cx('activities-page__results-count-text')}>
                      Có <span className={cx('activities-page__results-count-number')}>128</span> kết quả phù hợp
                    </Title>
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
                  {activities.map((activity) => (
                    <CardActivity
                      key={activity.id}
                      {...activity}
                      variant={screens.md ? 'horizontal' : 'vertical'}
                      state="guest"
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
                    <Pagination defaultCurrent={1} total={100} showSizeChanger={false} />
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
