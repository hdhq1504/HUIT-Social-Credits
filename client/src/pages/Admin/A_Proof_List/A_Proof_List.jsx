import React from 'react';
import layoutStyles from '../styles/AdminPage.module.scss';
import styles from './A_Proof_List.module.scss';
import { FileText, Hourglass, CheckCircle, XCircle, CalendarDays, Eye } from 'lucide-react';
import { proofListData } from './A_Proof_ListData';

export default function ProofPage() {
  const stats = [
    {
      label: 'Tổng minh chứng',
      value: '2,847',
      color: 'var(--primary-color)',
      icon: <FileText size={22} color="var(--primary-color)" />,
      bg: '#e8edff',
    },
    {
      label: 'Chờ duyệt',
      value: '456',
      color: 'var(--warning-color)',
      icon: <Hourglass size={22} color="var(--warning-color)" />,
      bg: '#fff3e0',
    },
    {
      label: 'Đã duyệt',
      value: '2,234',
      color: 'var(--success-color)',
      icon: <CheckCircle size={22} color="var(--success-color)" />,
      bg: '#e6f8ee',
    },
    {
      label: 'Từ chối',
      value: '157',
      color: 'var(--danger-color)',
      icon: <XCircle size={22} color="var(--danger-color)" />,
      bg: '#fdeaea',
    },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Đã duyệt':
        return styles['status-badge--success'];
      case 'Chờ duyệt':
        return styles['status-badge--pending'];
      case 'Từ chối':
        return styles['status-badge--fail'];
      default:
        return '';
    }
  };

  return (
    <div className={layoutStyles.wrapper}>
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Danh sách phản hồi</h1>
      </div>

      {/* === Thống kê 4 ô === */}
      <div className={styles['stats__grid']}>
        {stats.map((item, index) => (
          <div key={index} className={styles['stats__card']}>
            <div className={styles['stats__card-info']}>
              <p className={styles['stats__card-info-label']}>{item.label}</p>
              <h2 className={styles['stats__card-info-value']} style={{ color: item.color }}>
                {item.value}
              </h2>
            </div>
            <div className={styles['stats__card__icon-box']} style={{ backgroundColor: item.bg }}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* === Thanh bộ lọc === */}
      <div className={styles['filter-bar']}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles['filter-bar__input']} />
        <select className={styles['filter-bar__select']}>
          <option>Khoa</option>
        </select>
        <select className={styles['filter-bar__select']}>
          <option>Lớp</option>
        </select>
        <select className={styles['filter-bar__select']}>
          <option>Hoạt động</option>
        </select>
        <select className={styles['filter-bar__select']}>
          <option>Trạng thái</option>
        </select>
        <button className={styles['filter-bar__button']}>🔍 Lọc</button>
      </div>

      {/* === Bảng danh sách phản hồi === */}
      <div className={styles['table-container']}>
        <h1 className={layoutStyles.title}>Danh sách phản hồi</h1>
        <table className={styles['table-container__table']}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên sinh viên</th>
              <th>MSSV</th>
              <th>Khoa</th>
              <th>Lớp</th>
              <th>Hoạt động</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {proofListData.map((item, index) => (
              <tr key={index}>
                <td>{item.stt}</td>
                <td>
                  <div className={styles['student-info']}>
                    <img src={item.avatar} alt={item.name} className={styles['student-info__avatar']} />
                    <div className={styles['student-info__details']}>
                      <strong>{item.name}</strong>
                      <p className={styles['student-info__email']}>{item.email}</p>
                    </div>
                  </div>
                </td>
                <td>{item.mssv}</td>
                <td>{item.khoa}</td>
                <td>{item.lop}</td>
                <td>
                  <div className={styles['activity-info']}>
                    <strong>{item.hoatDong}</strong>
                    <p>
                      <CalendarDays size={14} /> {item.ngayHoatDong}
                    </p>
                  </div>
                </td>
                <td>{item.ngayGui}</td>
                <td>
                  <span className={`${styles['status-badge']} ${getStatusClass(item.trangThai)}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td>
                  <button className={styles['action-btn']}>
                    <Eye size={16} color="var(--primary-color)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
