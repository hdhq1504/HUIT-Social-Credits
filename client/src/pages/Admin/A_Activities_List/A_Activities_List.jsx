import React, { useState } from 'react';
import layoutStyles from '../styles/AdminPage.module.scss';
import styles from './A_Activities_List.module.scss';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';
import { Edit3, Trash2, ChevronLeft, ChevronRight, Search, Eye, ArrowLeft } from 'lucide-react';

import ActivitiesAddEditPage from './A_Activities_AddEdit/A_Activities_AddEdit.jsx';
import A_ActivityDetailPage from './A_Activity_Detail/A_Activity_Detail.jsx';
import { activitiesList } from './A_Activities_ListData.jsx';

registerLocale('vi', vi);

// ===== Hiển thị trạng thái hoạt động =====
const StatusBadge = ({ status }) => {
  let className = styles.badge;
  switch (status) {
    case 'Đang diễn ra':
      className += ` ${styles.badgeOngoing}`;
      break;
    case 'Đã kết thúc':
      className += ` ${styles.badgeFinished}`;
      break;
    default:
      className += ` ${styles.badgeDraft}`;
  }
  return <span className={className}>{status}</span>;
};

// ===== Hiển thị màu nhóm hoạt động =====
const getGroupBadgeClass = (groupName) => {
  switch (groupName) {
    case 'Nhóm 1':
      return styles.groupBadgeRed;
    case 'Nhóm 2, 3':
      return styles.groupBadgeGreen;
    default:
      return styles.groupBadge;
  }
};

// ===== Component danh sách hoạt động =====
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

      {/* Thanh lọc & tìm kiếm */}
      <div className={styles.filterBar}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles.searchInput} />

        <select className={styles.select}>
          <option value="">Nhóm hoạt động</option>
          <option>Nhóm 1</option>
          <option>Nhóm 2, 3</option>
        </select>

        <select className={styles.select}>
          <option value="">Trạng thái</option>
          <option>Đang diễn ra</option>
          <option>Đã kết thúc</option>
        </select>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="Thời gian"
          className={styles.dateInput}
          wrapperClassName={styles.dateInput}
          isClearable
          locale="vi"
        />

        <button className={styles.filterButton}>
          <Search size={16} /> Lọc
        </button>
      </div>

      {/* Bảng danh sách */}
      <div className={styles.contentBox}>
        <h1 className={layoutStyles.title}>Danh sách hoạt động</h1>
        <table className={styles.activitiesTable}>
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
                  <p className={styles.activityLocation}>{activity.diaDiem}</p>
                </td>
                <td>
                  <span className={`${styles.groupBadge} ${getGroupBadgeClass(activity.nhomHoatDong)}`}>
                    {activity.nhomHoatDong}
                  </span>
                </td>
                <td className={styles.pointColumn}>
                  <strong>{activity.diem}</strong>
                </td>
                <td>
                  <span className={styles.registered}>
                    {activity.soLuongDaDangKy}/{activity.soLuongToiDa}
                  </span>
                </td>
                <td>{activity.thoiGianBatDau}</td>
                <td>{activity.thoiGianKetThuc}</td>
                <td>
                  <StatusBadge status={activity.trangThai} />
                </td>
                <td className={styles.actionsColumn}>
                  <button
                    className={`${styles.actionButton} ${styles.viewButton}`}
                    onClick={() => onViewActivity(activity)}
                  >
                    <Eye size={16} />
                  </button>
                  <button className={`${styles.actionButton} ${styles.editButton}`}>
                    <Edit3 size={16} />
                  </button>
                  <button className={`${styles.actionButton} ${styles.deleteButton}`}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className={styles.footerBar}>
        <div className={styles.selectionInfo}>
          <p>
            Đã chọn <span>0</span> trong {totalItems} kết quả
          </p>
        </div>
        <div className={styles.pagination}>
          <button className={styles.pageButton} disabled={currentPage === 1}>
            <ChevronLeft size={16} /> Trước
          </button>

          {renderPageButtons()}

          <button className={styles.pageButton} disabled={currentPage === totalPages}>
            Tiếp <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

// ===== Trang chính =====
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
          <button key={page} className={page === currentPage ? styles.pageActive : styles.pageButton}>
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
