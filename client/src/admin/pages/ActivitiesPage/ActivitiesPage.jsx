import React, { useState } from 'react';
import classNames from 'classnames/bind';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit3, Trash2, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';
import vi from 'date-fns/locale/vi';
import ActivitiesAddEditPage from '../ActivitiesAddEditPage/ActivitiesAddEditPage.jsx';
import ActivityDetailPage from '../ActivitiesDetailPage/ActivitiesDetailPage.jsx';
import { activitiesList } from './ActivitiesPageData.jsx';
import styles from './ActivitiesPage.module.scss';

const cx = classNames.bind(styles);
registerLocale('vi', vi);

/* ---------------- Status Badge ---------------- */
const StatusBadge = ({ status }) => {
  const badgeClass = cx('activities-list__status-badge', {
    'activities-list__status-badge--ongoing': status === 'Đang diễn ra',
    'activities-list__status-badge--finished': status === 'Đã kết thúc',
  });
  return <span className={badgeClass}>{status}</span>;
};

/* ---------------- Group Badge ---------------- */
const getGroupBadgeClass = (groupName) =>
  cx('activities-list__group-badge', {
    'activities-list__group-badge--red': groupName === 'Nhóm 1',
    'activities-list__group-badge--green': groupName === 'Nhóm 2, 3',
  });

/* ---------------- Content Component ---------------- */
const ActivitiesListContent = ({
  totalItems,
  currentPage,
  totalPages,
  renderPageButtons,
  setStartDate,
  startDate,
  onAddNewActivity,
  onViewActivity,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);

  const handleCheckboxChange = (stt) => {
    setSelectedRows((prev) => (prev.includes(stt) ? prev.filter((s) => s !== stt) : [...prev, stt]));
  };

  return (
    <div className={cx('activities-page')}>
      {/* Filter Bar */}
      <div className={cx('activities-list__filter-bar')}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={cx('activities-list__search-input')} />
        <select className={cx('activities-list__select')}>
          <option value="">Nhóm hoạt động</option>
          <option>Nhóm 1</option>
          <option>Nhóm 2, 3</option>
        </select>
        <select className={cx('activities-list__select')}>
          <option value="">Trạng thái</option>
          <option>Đang diễn ra</option>
          <option>Đã kết thúc</option>
        </select>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Thời gian"
          className={cx('activities-list__date-input')}
          wrapperClassName={cx('activities-list__date-input-wrapper')}
          isClearable
          locale="vi"
        />
        <button className={cx('activities-list__filter-button')}>
          <Search size={16} /> Lọc
        </button>
      </div>

      {/* Table */}
      <div className={cx('activities-list__content-box')}>
        <table className={cx('activities-list__table')}>
          <thead>
            <tr>
              <th></th>
              <th>STT</th>
              <th>Tên hoạt động</th>
              <th>Nhóm hoạt động</th>
              <th>Điểm</th>
              <th>Số lượng</th>
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {activitiesList.map((activity, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(activity.stt)}
                    onChange={() => handleCheckboxChange(activity.stt)}
                  />
                </td>
                <td>{activity.stt}</td>
                <td>
                  <strong>{activity.tenHoatDong}</strong>
                  <p className={cx('activities-list__activity-location')}>{activity.diaDiem}</p>
                </td>
                <td>
                  <span className={getGroupBadgeClass(activity.nhomHoatDong)}>{activity.nhomHoatDong}</span>
                </td>
                <td className={cx('activities-list__point')}>
                  <strong>{activity.diem}</strong>
                </td>
                <td>
                  {activity.soLuongDaDangKy}/{activity.soLuongToiDa}
                </td>
                <td>{activity.thoiGianBatDau}</td>
                <td>{activity.thoiGianKetThuc}</td>
                <td>
                  <StatusBadge status={activity.trangThai} />
                </td>
                <td className={cx('activities-list__actions')}>
                  <button
                    className={cx('activities-list__actions-button', 'activities-list__actions-button--view')}
                    onClick={() => onViewActivity(activity)}
                  >
                    <Eye size={16} />
                  </button>
                  <button className={cx('activities-list__actions-button', 'activities-list__actions-button--edit')}>
                    <Edit3 size={16} />
                  </button>
                  <button className={cx('activities-list__actions-button', 'activities-list__actions-button--delete')}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className={cx('activities-list__footer')}>
          <div className={cx('activities-list__footer-info')}>
            <p>
              Đã chọn <span>{selectedRows.length}</span> trong {totalItems} kết quả
            </p>
          </div>
          <div className={cx('activities-list__footer-pagination')}>
            <button className={cx('activities-list__footer-page')} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Trước
            </button>
            {renderPageButtons()}
            <button className={cx('activities-list__footer-page')} disabled={currentPage === totalPages}>
              Tiếp <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Page ---------------- */
export default function ActivitiesPage() {
  const [viewMode, setViewMode] = useState('list'); // list | add | detail
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [currentPage] = useState(1);

  const totalItems = activitiesList.length;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderPageButtons = () => {
    const visiblePages = Math.min(totalPages, 3);
    const pages = Array.from({ length: visiblePages }, (_, i) => i + 1);

    return (
      <>
        {pages.map((page) => (
          <button
            key={page}
            className={cx('activities-list__footer-page', {
              'activities-list__footer-page--active': page === currentPage,
            })}
          >
            {page}
          </button>
        ))}
        {totalPages > 3 && <span style={{ padding: '0 5px', color: '#888' }}>...</span>}
      </>
    );
  };

  const handleAddNewActivity = () => setViewMode('add');
  const handleBackToList = () => setViewMode('list');
  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setViewMode('detail');
  };

  return (
    <div className={cx('activities-page__wrapper')}>
      {viewMode === 'list' && (
        <ActivitiesListContent
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          renderPageButtons={renderPageButtons}
          setStartDate={setStartDate}
          startDate={startDate}
          onAddNewActivity={handleAddNewActivity}
          onViewActivity={handleViewActivity}
        />
      )}
      {viewMode === 'add' && <ActivitiesAddEditPage onBackToList={handleBackToList} />}
      {viewMode === 'detail' && selectedActivity && (
        <ActivityDetailPage activity={selectedActivity} onBackToList={handleBackToList} />
      )}
    </div>
  );
}
