import React, { useState, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './ScoringPage.module.scss';
import { scoringListData } from './ScoringPageData';
import { Check, AlertTriangle, X, CalendarDays, Eye } from 'lucide-react';
import { Pagination, ConfigProvider } from 'antd';

const cx = classNames.bind(styles);
const PAGE_SIZE = 10;

export default function ScoringPage() {
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

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
        return 'scoring-list__status-badge--success';
      case 'Chờ duyệt':
        return 'scoring-list__status-badge--pending';
      case 'Không đạt':
        return 'scoring-list__status-badge--fail';
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

  const totalItems = scoringListData.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return scoringListData.slice(start, start + PAGE_SIZE);
  }, [safePage]);

  return (
    <div className={cx('scoring-list')}>
      {/* Header */}
      <header className={cx('scoring-list__header')}>
        <h1 className={cx('scoring-list__title')}>Danh sách chấm điểm CTXH</h1>
      </header>

      {/* Bộ lọc */}
      <section className={cx('scoring-list__filter-bar')}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={cx('scoring-list__filter-input')} />
        <select className={cx('scoring-list__filter-select')}>
          <option>Khoa</option>
        </select>
        <select className={cx('scoring-list__filter-select')}>
          <option>Lớp</option>
        </select>
        <select className={cx('scoring-list__filter-select')}>
          <option>Hoạt động</option>
        </select>
        <select className={cx('scoring-list__filter-select')}>
          <option>Trạng thái</option>
        </select>
        <button className={cx('scoring-list__filter-button')}>🔍 Lọc</button>
      </section>

      {/* Bảng */}
      <section className={cx('scoring-list__table-container')}>
        <table className={cx('scoring-list__table')}>
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
            {paginatedData.map((item, i) => {
              const originalIndex = (safePage - 1) * PAGE_SIZE + i;
              return (
                <tr key={originalIndex}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(originalIndex)}
                      onChange={() => handleSelectRow(originalIndex)}
                    />
                  </td>
                  <td>{item.stt}</td>
                  <td>
                    <div className={cx('scoring-list__student-info')}>
                      <img src={item.avatar} alt={item.tenSinhVien} className={cx('scoring-list__student-avatar')} />
                      <div>
                        <strong className={cx('scoring-list__student-name')}>{item.tenSinhVien}</strong>
                        <p className={cx('scoring-list__student-email')}>{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{item.mssv}</td>
                  <td>{item.khoa}</td>
                  <td>{item.lop}</td>
                  <td>
                    <div className={cx('scoring-list__activity-info')}>
                      <strong>{item.hoatDong}</strong>
                      <p>
                        <CalendarDays size={14} /> {item.ngayHoatDong}
                      </p>
                    </div>
                  </td>
                  <td className={cx('scoring-list__score')}>+{item.diem}</td>
                  <td>
                    <div className={cx('scoring-list__check-item')}>
                      {getIcon(item.checkIn.icon)}
                      <div className={cx('scoring-list__check-details')}>
                        <strong>{item.checkIn.time}</strong>
                        <p
                          className={cx(
                            `scoring-list__check-status--${
                              item.checkIn.status === 'Đúng giờ'
                                ? 'on-time'
                                : item.checkIn.status === 'Trễ giờ'
                                  ? 'late'
                                  : 'absent'
                            }`,
                          )}
                        >
                          {item.checkIn.status}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={cx('scoring-list__check-item')}>
                      {getIcon(item.checkOut.icon)}
                      <div className={cx('scoring-list__check-details')}>
                        <strong>{item.checkOut.time}</strong>
                        <p
                          className={cx(
                            `scoring-list__check-status--${
                              item.checkOut.status === 'Đúng giờ'
                                ? 'on-time'
                                : item.checkOut.status === 'Trễ giờ'
                                  ? 'late'
                                  : 'absent'
                            }`,
                          )}
                        >
                          {item.checkOut.status}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cx('scoring-list__status-badge', getStatusClass(item.trangThai))}>
                      {item.trangThai}
                    </span>
                  </td>
                  <td>
                    <button className={cx('scoring-list__action-btn')}>
                      <Eye size={16} color="var(--primary-color)" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Thanh chọn */}
        {selectedRows.length > 0 && (
          <div className={cx('scoring-list__selection-bar')}>
            <span className={cx('scoring-list__selected-count')}>{selectedRows.length} sinh viên đã chọn</span>
            <button className={cx('scoring-list__clear-btn')} onClick={handleClearSelection}>
              <X size={14} color="orange" /> Bỏ chọn tất cả
            </button>
            <div className={cx('scoring-list__selection-actions')}>
              <button className={cx('scoring-list__action', 'scoring-list__action--approve')}>
                <Check size={14} /> Duyệt đạt
              </button>
              <button className={cx('scoring-list__action', 'scoring-list__action--reject')}>
                <X size={14} /> Không đạt
              </button>
            </div>
          </div>
        )}

        {/* Phân trang */}
        <div className={cx('scoring-list__pagination')}>
          <span className={cx('scoring-list__pagination-info')}>
            Đã chọn {selectedRows.length} trong {totalItems} kết quả
          </span>
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
              total={totalItems}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              hideOnSinglePage
            />
          </ConfigProvider>
        </div>
      </section>
    </div>
  );
}
