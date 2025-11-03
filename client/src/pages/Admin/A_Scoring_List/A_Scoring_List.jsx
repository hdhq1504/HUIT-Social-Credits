import React, { useState } from 'react';
import layoutStyles from '../styles/AdminPage.module.scss';
import styles from './A_Scoring_List.module.scss';
import { scoringListData } from './A_Scoring_ListData';
import { Check, AlertTriangle, X, CalendarDays, Eye } from 'lucide-react';

export default function ScoringPage() {
  const [selectedRows, setSelectedRows] = useState([]);

  const getIcon = (type) => {
    switch (type) {
      case 'tick':
        return <Check color="green" size={16} />;
      case 'alert':
        return <AlertTriangle color="orange" size={16} />;
      case 'x':
        return <X color="red" size={16} />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Đạt':
        return styles['scoring-list__status-badge--success'];
      case 'Chờ duyệt':
        return styles['scoring-list__status-badge--pending'];
      case 'Không đạt':
        return styles['scoring-list__status-badge--fail'];
      default:
        return '';
    }
  };

  const handleSelectRow = (index) => {
    setSelectedRows((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const handleSelectAll = () => {
    setSelectedRows(selectedRows.length === scoringListData.length ? [] : scoringListData.map((_, i) => i));
  };

  const handleClearSelection = () => setSelectedRows([]);

  const allSelected = selectedRows.length === scoringListData.length;

  return (
    <div className={layoutStyles.wrapper}>
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Danh sách chấm điểm CTXH</h1>
      </div>

      <div className={styles['scoring-list__filter-bar']}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles['scoring-list__filter-input']} />
        <select className={styles['scoring-list__filter-select']}>
          <option>Khoa</option>
        </select>
        <select className={styles['scoring-list__filter-select']}>
          <option>Lớp</option>
        </select>
        <select className={styles['scoring-list__filter-select']}>
          <option>Hoạt động</option>
        </select>
        <select className={styles['scoring-list__filter-select']}>
          <option>Trạng thái</option>
        </select>
        <button className={styles['scoring-list__filter-button']}>🔍 Lọc</button>
      </div>

      <div className={styles['scoring-list__table-container']}>
        <h1 className={layoutStyles.title}>Danh sách minh chứng</h1>
        <table className={styles['scoring-list__table']}>
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
              </th>
              <th>STT</th>
              <th>Tên sinh viên</th>
              <th>MSSV</th>
              <th>Khoa</th>
              <th>Lớp</th>
              <th>Hoạt động</th>
              <th>Điểm</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {scoringListData.map((item, i) => (
              <tr key={i}>
                <td>
                  <input type="checkbox" checked={selectedRows.includes(i)} onChange={() => handleSelectRow(i)} />
                </td>
                <td>{item.stt}</td>
                <td>
                  <div className={styles['scoring-list__student-info']}>
                    <img src={item.avatar} alt={item.tenSinhVien} className={styles['scoring-list__student-avatar']} />
                    <div>
                      <strong className={styles['scoring-list__student-name']}>{item.tenSinhVien}</strong>
                      <p className={styles['scoring-list__student-email']}>{item.email}</p>
                    </div>
                  </div>
                </td>
                <td>{item.mssv}</td>
                <td>{item.khoa}</td>
                <td>{item.lop}</td>
                <td>
                  <div className={styles['scoring-list__activity-info']}>
                    <strong>{item.hoatDong}</strong>
                    <p>
                      <CalendarDays size={14} /> {item.ngayHoatDong}
                    </p>
                  </div>
                </td>
                <td style={{ color: '#00008b', fontWeight: '600' }}>+{item.diem}</td>
                <td>
                  <div className={styles['scoring-list__check-item']}>
                    {getIcon(item.checkIn.icon)}
                    <div className={styles['scoring-list__check-details']}>
                      <strong>{item.checkIn.time}</strong>
                      <p
                        className={
                          styles[
                            `scoring-list__check-status--${item.checkIn.status === 'Đúng giờ' ? 'on-time' : item.checkIn.status === 'Trễ giờ' ? 'late' : 'absent'}`
                          ]
                        }
                      >
                        {item.checkIn.status}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles['scoring-list__check-item']}>
                    {getIcon(item.checkOut.icon)}
                    <div className={styles['scoring-list__check-details']}>
                      <strong>{item.checkOut.time}</strong>
                      <p
                        className={
                          styles[
                            `scoring-list__check-status--${item.checkOut.status === 'Đúng giờ' ? 'on-time' : item.checkOut.status === 'Trễ giờ' ? 'late' : 'absent'}`
                          ]
                        }
                      >
                        {item.checkOut.status}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles['scoring-list__status-badge']} ${getStatusClass(item.trangThai)}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td>
                  <button className={styles['scoring-list__action-btn']}>
                    <Eye size={16} color="#00008b" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedRows.length > 0 && (
          <div className={styles['scoring-list__selection-bar']}>
            <span className={styles['scoring-list__selected-count']}>{selectedRows.length} sinh viên đã chọn</span>
            <button className={styles['scoring-list__clear-btn']} onClick={handleClearSelection}>
              <X size={14} color="orange" /> Bỏ chọn tất cả
            </button>
            <div className={styles['scoring-list__selection-actions']}>
              <button className={`${styles['scoring-list__action']} ${styles['scoring-list__action--approve']}`}>
                <Check size={14} /> Duyệt đạt
              </button>
              <button className={`${styles['scoring-list__action']} ${styles['scoring-list__action--reject']}`}>
                <X size={14} /> Không đạt
              </button>
            </div>
          </div>
        )}

        <div className={styles['scoring-list__pagination']}>
          <span className={styles['scoring-list__pagination-info']}>
            Đã chọn {selectedRows.length} trong {scoringListData.length} kết quả
          </span>
          <div className={styles['scoring-list__page-nav']}>
            <button className={styles['scoring-list__pagination-button']}>‹ Trước</button>
            <button
              className={`${styles['scoring-list__pagination-button']} ${styles['scoring-list__pagination-button--active']}`}
            >
              1
            </button>
            <button className={styles['scoring-list__pagination-button']}>2</button>
            <button className={styles['scoring-list__pagination-button']}>3</button>
            <button className={styles['scoring-list__pagination-button']}>…</button>
            <button className={styles['scoring-list__pagination-button']}>16</button>
            <button className={styles['scoring-list__pagination-button']}>Tiếp ›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
