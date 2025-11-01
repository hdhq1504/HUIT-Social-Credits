import React, { useState } from 'react';
import layoutStyles from '../styles/AdminPage.module.scss';
import styles from './A_Scoring_List.module.scss';
import { scoringListData } from './A_Scoring_ListData';
import { Check, AlertTriangle, X, CalendarDays, Eye } from 'lucide-react';

export default function ScoringPage() {
  const [selectedRows, setSelectedRows] = useState([]);

  // === Icon cho check-in/out ===
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

  // === Class trạng thái ===
  const getStatusClass = (status) => {
    switch (status) {
      case 'Đạt':
        return styles.success;
      case 'Chờ duyệt':
        return styles.pending;
      case 'Không đạt':
        return styles.fail;
      default:
        return '';
    }
  };

  // === Chọn 1 hàng ===
  const handleSelectRow = (index) => {
    setSelectedRows((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  // === Chọn tất cả / bỏ chọn tất cả ===
  const handleSelectAll = () => {
    if (selectedRows.length === scoringListData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(scoringListData.map((_, index) => index));
    }
  };

  // === Bỏ chọn toàn bộ ===
  const handleClearSelection = () => {
    setSelectedRows([]);
  };

  // === Kiểm tra có chọn hết chưa ===
  const allSelected = selectedRows.length === scoringListData.length;

  return (
    <div className={layoutStyles.wrapper}>
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Danh sách chấm điểm CTXH</h1>
      </div>

      {/* === Thanh bộ lọc === */}
      <div className={styles.filterBar}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles.searchInput} />
        <select className={styles.select}>
          <option>Khoa</option>
        </select>
        <select className={styles.select}>
          <option>Lớp</option>
        </select>
        <select className={styles.select}>
          <option>Hoạt động</option>
        </select>
        <select className={styles.select}>
          <option>Trạng thái</option>
        </select>
        <button className={styles.filterButton}>🔍 Lọc</button>
      </div>

      {/* === Bảng minh chứng === */}
      <div className={styles.tableContainer}>
        <h1 className={layoutStyles.title}>Danh sách minh chứng</h1>
        <table>
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
            {scoringListData.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(index)}
                    onChange={() => handleSelectRow(index)}
                  />
                </td>
                <td>{item.stt}</td>
                <td>
                  <div className={styles.studentInfo}>
                    <img src={item.avatar} alt={item.tenSinhVien} />
                    <div>
                      <strong>{item.tenSinhVien}</strong>
                      <p>{item.email}</p>
                    </div>
                  </div>
                </td>
                <td>{item.mssv}</td>
                <td>{item.khoa}</td>
                <td>{item.lop}</td>
                <td>
                  <div className={styles.activityInfo}>
                    <strong>{item.hoatDong}</strong>
                    <p>
                      <CalendarDays size={14} /> {item.ngayHoatDong}
                    </p>
                  </div>
                </td>
                <td style={{ color: '#00008b', fontWeight: '600' }}>+{item.diem}</td>
                <td>
                  <div className={styles.checkItem}>
                    {getIcon(item.checkIn.icon)}
                    <div className={styles.checkDetails}>
                      <strong>{item.checkIn.time}</strong>
                      <p
                        className={
                          item.checkIn.status === 'Đúng giờ'
                            ? styles.onTime
                            : item.checkIn.status === 'Trễ giờ'
                              ? styles.late
                              : styles.absent
                        }
                      >
                        {item.checkIn.status}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.checkItem}>
                    {getIcon(item.checkOut.icon)}
                    <div className={styles.checkDetails}>
                      <strong>{item.checkOut.time}</strong>
                      <p
                        className={
                          item.checkOut.status === 'Đúng giờ'
                            ? styles.onTime
                            : item.checkOut.status === 'Trễ giờ'
                              ? styles.late
                              : styles.absent
                        }
                      >
                        {item.checkOut.status}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(item.trangThai)}`}>{item.trangThai}</span>
                </td>
                <td>
                  <button className={styles.actionBtn}>
                    <Eye size={16} color="#00008b" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* === Hàng hiển thị số sinh viên đã chọn === */}
        {selectedRows.length > 0 && (
          <div className={styles.selectionBar}>
            <span className={styles.selectedCount}>{selectedRows.length} sinh viên đã chọn</span>
            <button className={styles.clearBtn} onClick={handleClearSelection}>
              <X size={14} color="orange" /> Bỏ chọn tất cả
            </button>
            <div className={styles.selectionActions}>
              <button className={`${styles.action} ${styles.approve}`}>
                <Check size={14} /> Duyệt đạt
              </button>
              <button className={`${styles.action} ${styles.reject}`}>
                <X size={14} /> Không đạt
              </button>
            </div>
          </div>
        )}

        {/* === Phân trang === */}
        <div className={styles.pagination}>
          <span className={styles.info}>
            Đã chọn {selectedRows.length} trong {scoringListData.length} kết quả
          </span>
          <div className={styles.pageNav}>
            <button>‹ Trước</button>
            <button className={styles.active}>1</button>
            <button>2</button>
            <button>3</button>
            <button>…</button>
            <button>16</button>
            <button>Tiếp ›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
