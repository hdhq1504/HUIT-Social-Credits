import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ConfigProvider, Row, Col, Typography, Select, Pagination } from 'antd';
import CardActivity from '@components/CardActivity/CardActivity';
import CheckboxGroup from '@components/CheckboxGroup/CheckboxGroup';
import RegisterModal from '@components/RegisterModal/RegisterModal';
// import useToast from '@components/Toast/Toast';
import SearchBar from '@layouts/components/SearchBar/SearchBar';
import styles from './ListActivitiesPage.module.scss';
import { mockApi } from '../../utils/mockAPI';

const cx = classNames.bind(styles);

const { Title, Text } = Typography;

function ListActivitiesPage() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const options = [
    { value: 'Tất cả', label: 'Tất cả' },
    { value: 'Địa chỉ đỏ', label: 'Địa chỉ đỏ' },
    { value: 'Mùa hè xanh', label: 'Mùa hè xanh' },
    { value: 'Xuân tình nguyện', label: 'Xuân tình nguyện' },
    { value: 'Hiến máu', label: 'Hiến máu' },
    { value: 'Hỗ trợ', label: 'Hỗ trợ' },
  ];
  const [activities, setActivities] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  // const { contextHolder, open } = useToast();

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

  const handleOpenRegister = (activity) => {
    setSelectedActivity(activity);
    setOpen(true);
  };

  const handleConfirm = (activity) => {
    setSelectedActivity(activity);
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  return (
    <section className={cx('activities-page')}>
      {/* {contextHolder} */}
      <div className={cx('activities-page__search')}>
        <SearchBar
          variant="list"
          groups={['Tất cả', 'Địa chỉ đỏ', 'Mùa hè xanh', 'Xuân tình nguyện', 'Hiến máu', 'Hỗ trợ']}
          statuses={['Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc']}
          onSubmit={(query) => console.log('List filter search:', query)}
        />
      </div>

      <div className={cx('activities-page__container')}>
        <nav className={cx('activities-page__breadcrumb')}>
          <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> /{' '}
          <span>Sắp xếp ngày đăng gần nhất</span>
        </nav>

        <div className={cx('acitivities-page__layout')}>
          <Row gutter={[24, 24]}>
            {/* Content 9/12 */}
            <Col xs={24} lg={18} className={cx('activities-page__results-column')}>
              <div className={cx('activities-page__results-header')}>
                <div className={cx('activities-page__results-count')}>
                  <Title level={5} className={cx('activities-page__count-text')}>
                    Có <span className={cx('activities-page__count-number')}>128</span> kết quả phù hợp
                  </Title>
                </div>

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
              </div>

              <div className={cx('activities-page__cards')}>
                {activities.map((activity) => (
                  <CardActivity
                    key={activity.id}
                    {...activity}
                    variant="horizontal"
                    onDetails={() => console.log('Chi tiết:', activity.title)}
                    onRegister={() => handleOpenRegister(activity)}
                  />
                ))}
              </div>

              <div className={cx('activities-page__pagination')}>
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
                  <Pagination defaultCurrent={1} total={100} />
                </ConfigProvider>
              </div>
            </Col>

            {/* Sidebar 3/12 */}
            <Col xs={24} lg={6}>
              <div className="activities-page__filters">
                <CheckboxGroup selectedValues={selectedItems} onChange={setSelectedItems} options={options} />
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <RegisterModal
        open={open}
        variant="confirm"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        campaignName={selectedActivity?.title || 'Hoạt động'}
        pointsLabel={selectedActivity?.points != null ? `${selectedActivity.points} điểm` : undefined}
        dateTime={selectedActivity?.dateTime}
        location={selectedActivity?.location}
        // groupLabel: để default trong component nếu bạn chưa có dữ liệu nhóm
      />
    </section>
  );
}

export default ListActivitiesPage;
