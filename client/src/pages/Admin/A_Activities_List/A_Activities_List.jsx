import React, { useState } from 'react';
import layoutStyles from '../styles/AdminPage.module.scss';
import styles from './A_Activities_List.module.scss';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import vi from 'date-fns/locale/vi';

import { Edit3, Trash2, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';
import ActivitiesAddEditPage from './A_Activities_AddEdit/A_Activities_AddEdit.jsx';
import A_ActivityDetailPage from './A_Activity_Detail/A_Activity_Detail.jsx';
import { activitiesList } from './A_Activities_ListData.jsx';

registerLocale('vi', vi);

/* ---------------- Status Badge ---------------- */
const StatusBadge = ({ status }) => {
  let badgeClass = `${styles['activities-list__status-badge']}`;
  if (status === 'Đang diễn ra') badgeClass += ` ${styles['activities-list__status-badge--ongoing']}`;
  else if (status === 'Đã kết thúc') badgeClass += ` ${styles['activities-list__status-badge--finished']}`;
  return <span className={badgeClass}>{status}</span>;
};

/* ---------------- Group Badge ---------------- */
const getGroupBadgeClass = (groupName) => {
  if (groupName === 'Nhóm 1')
    return `${styles['activities-list__group-badge']} ${styles['activities-list__group-badge--red']}`;
  if (groupName === 'Nhóm 2, 3')
    return `${styles['activities-list__group-badge']} ${styles['activities-list__group-badge--green']}`;
  return styles['activities-list__group-badge'];
};

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
  return (
    <>
      {/* Header */}
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Danh sách hoạt động</h1>
        <button className={layoutStyles.addButton} onClick={onAddNewActivity}>
          <span className={layoutStyles.plusIcon}>+</span> Thêm hoạt động mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className={styles['activities-list__filter-bar']}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles['activities-list__search-input']} />

        <select className={styles['activities-list__select']}>
          <option value="">Nhóm hoạt động</option>
          <option>Nhóm 1</option>
          <option>Nhóm 2, 3</option>
        </select>

        <select className={styles['activities-list__select']}>
          <option value="">Trạng thái</option>
          <option>Đang diễn ra</option>
          <option>Đã kết thúc</option>
        </select>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Thời gian"
          className={styles['activities-list__date-input']}
          wrapperClassName={styles['activities-list__date-input']}
          isClearable
          locale="vi"
        />

        <button className={styles['activities-list__filter-button']}>
          <Search size={16} /> Lọc
        </button>
      </div>

      {/* Table */}
      <div className={styles['activities-list__content-box']}>
        <h1 className={layoutStyles.title}>Danh sách hoạt động</h1>
        <table className={styles['activities-list__table']}>
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
                  <input type="checkbox" />
                </td>
                <td>{activity.stt}</td>
                <td>
                  <strong>{activity.tenHoatDong}</strong>
                  <p className={styles['activities-list__activity-location']}>{activity.diaDiem}</p>
                </td>
                <td>
                  <span className={getGroupBadgeClass(activity.nhomHoatDong)}>{activity.nhomHoatDong}</span>
                </td>
                <td className={styles['activities-list__point']}>
                  <strong>{activity.diem}</strong>
                </td>
                <td>
                  <span>
                    {activity.soLuongDaDangKy}/{activity.soLuongToiDa}
                  </span>
                </td>
                <td>{activity.thoiGianBatDau}</td>
                <td>{activity.thoiGianKetThuc}</td>
                <td>
                  <StatusBadge status={activity.trangThai} />
                </td>
                <td className={styles['activities-list__actions']}>
                  <button
                    className={`${styles['activities-list__actions-button']} ${styles['activities-list__actions-button--view']}`}
                    onClick={() => onViewActivity(activity)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className={`${styles['activities-list__actions-button']} ${styles['activities-list__actions-button--edit']}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className={`${styles['activities-list__actions-button']} ${styles['activities-list__actions-button--delete']}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles['activities-list__footer']}>
        <div className={styles['activities-list__footer-info']}>
          <p>
            Đã chọn <span>0</span> trong {totalItems} kết quả
          </p>
        </div>

        <div className={styles['activities-list__footer-pagination']}>
          <button className={styles['activities-list__footer-page']} disabled={currentPage === 1}>
            <ChevronLeft size={16} /> Trước
          </button>

          {renderPageButtons()}

          <button className={styles['activities-list__footer-page']} disabled={currentPage === totalPages}>
            Tiếp <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
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
            className={
              page === currentPage
                ? `${styles['activities-list__footer-page']} ${styles['activities-list__footer-page--active']}`
                : styles['activities-list__footer-page']
            }
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
    <div className={layoutStyles.wrapper}>
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
        <A_ActivityDetailPage activity={selectedActivity} onBackToList={handleBackToList} />
      )}
    </div>
  );
}
