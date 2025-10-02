import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Row, Col, Typography, Select, Pagination } from 'antd';
import CardActivity from '../../components/CardActivity/CardActivity';
import CheckboxGroup from '../../components/CheckboxGroup/CheckboxGroup';
import SearchBar from '../../layouts/components/SearchBar/SearchBar';
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
    <>
      <div className={cx('searchbar')}>
        <SearchBar
          variant="list"
          groups={['Tất cả', 'Địa chỉ đỏ', 'Mùa hè xanh', 'Xuân tình nguyện', 'Hiến máu', 'Hỗ trợ']}
          statuses={['Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc']}
          onSubmit={(q) => console.log('List filter search:', q)}
        />
      </div>
      
      <div className={cx('wrapper')}>
        <div className={cx('link')}>
          <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> /{' '}
          <span>Sắp xếp ngày đăng gần nhất</span>
        </div>

        <div className={cx('container')}>
          <Row gutter={[24, 24]}>
            {/* Content 9/12 */}
            <Col xs={24} lg={18} className={cx('activities__col-9')}>
              <div className={cx('activities__header')}>
                <div className={cx('activities__count')}>
                  <Title level={5} className={cx('activities__count-text')}>
                    Có <span className={cx('activities__count-number')}>128</span> kết quả phù hợp
                  </Title>
                </div>

                <div className={cx('activities__sort')}>
                  <Text className={cx('activities__sort-label')}>Sắp xếp theo</Text>
                  <Select
                    size="middle"
                    value={sortBy}
                    onChange={setSortBy}
                    className={cx('activities__sort-select')}
                    options={[
                      { value: 'latest', label: 'Ngày đăng gần nhất' },
                      { value: 'points_desc', label: 'Điểm cao → thấp' },
                      { value: 'points_asc', label: 'Điểm thấp → cao' },
                    ]}
                  />
                </div>
              </div>

              <div className={cx('activities__list')}>
                {activities.map((a) => (
                  <CardActivity
                    key={a.id}
                    {...a}
                    variant="horizontal"
                    onDetails={() => console.log('Chi tiết:', a.title)}
                    onRegister={() => console.log('Đăng ký:', a.title)}
                  />
                ))}
              </div>

              <div className={cx('activities__footer')}>
                <Pagination defaultCurrent={1} total={100} />
              </div>
            </Col>

            {/* Sidebar 3/12 */}
            <Col xs={24} lg={6}>
              <div className="activities__sidebar">
                <CheckboxGroup selectedValues={selectedItems} onChange={setSelectedItems} options={options} />
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default ListActivitiesPage;
