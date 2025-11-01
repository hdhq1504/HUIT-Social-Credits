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
      color: '#00008b',
      icon: <FileText size={22} color="#00008b" />,
      bg: '#e8edff',
    },
    {
      label: 'Chờ duyệt',
      value: '456',
      color: '#e67e00',
      icon: <Hourglass size={22} color="#e67e00" />,
      bg: '#fff3e0',
    },
    {
      label: 'Đã duyệt',
      value: '2,234',
      color: '#1e8e3e',
      icon: <CheckCircle size={22} color="#1e8e3e" />,
      bg: '#e6f8ee',
    },
    {
      label: 'Từ chối',
      value: '157',
      color: '#d93025',
      icon: <XCircle size={22} color="#d93025" />,
      bg: '#fdeaea',
    },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Đã duyệt':
        return styles.success;
      case 'Chờ duyệt':
        return styles.pending;
      case 'Từ chối':
        return styles.fail;
      default:
        return '';
    }
  };

  return (
    <div className={layoutStyles.wrapper}>
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Danh sách phản hồi</h1>
      </div>

      {/* === 4 ô thống kê === */}
      <div className={styles.statsGrid}>
        {stats.map((item, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statInfo}>
              <p className={styles.label}>{item.label}</p>
              <h2 style={{ color: item.color }}>{item.value}</h2>
            </div>
            <div className={styles.iconBox} style={{ backgroundColor: item.bg }}>
              {item.icon}
            </div>
          </div>
        ))}
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

      {/* === Bảng danh sách === */}
      <div className={styles.tableContainer}>
        <h1 className={layoutStyles.title}>Danh sách phản hồi</h1>
        <table className={styles.proofTable}>
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
                  <div className={styles.studentInfo}>
                    <img src={item.avatar} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
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
                <td>{item.ngayGui}</td>
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
      </div>
    </div>
  );
}
