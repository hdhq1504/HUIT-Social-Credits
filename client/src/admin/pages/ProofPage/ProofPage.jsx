import React from 'react';
import classNames from 'classnames/bind';
import styles from './ProofPage.module.scss';
import { FileText, Hourglass, CheckCircle, XCircle, CalendarDays, Eye } from 'lucide-react';
import { proofListData } from './ProofPageData';

const cx = classNames.bind(styles);

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
        return 'status-badge--success';
      case 'Chờ duyệt':
        return 'status-badge--pending';
      case 'Từ chối':
        return 'status-badge--fail';
      default:
        return '';
    }
  };

  return (
    <div className={cx('proof-page')}>
      {/* Header */}
      <header className={cx('proof-page__header')}>
        <h1 className={cx('proof-page__title')}>Danh sách phản hồi</h1>
      </header>

      {/* Thống kê */}
      <section className={cx('stats')}>
        <div className={cx('stats__grid')}>
          {stats.map((item, index) => (
            <div key={index} className={cx('stats__card')}>
              <div className={cx('stats__info')}>
                <p className={cx('stats__label')}>{item.label}</p>
                <h2 className={cx('stats__value')} style={{ color: item.color }}>
                  {item.value}
                </h2>
              </div>
              <div className={cx('stats__icon-box')} style={{ backgroundColor: item.bg }}>
                {item.icon}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bộ lọc */}
      <section className={cx('filter')}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={cx('filter__input')} />
        <select className={cx('filter__select')}>
          <option>Khoa</option>
        </select>
        <select className={cx('filter__select')}>
          <option>Lớp</option>
        </select>
        <select className={cx('filter__select')}>
          <option>Hoạt động</option>
        </select>
        <select className={cx('filter__select')}>
          <option>Trạng thái</option>
        </select>
        <button className={cx('filter__button')}>🔍 Lọc</button>
      </section>

      {/* Bảng minh chứng */}
      <section className={cx('table')}>
        <table className={cx('table__main')}>
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
                  <div className={cx('student')}>
                    <img src={item.avatar} alt={item.name} className={cx('student__avatar')} />
                    <div className={cx('student__info')}>
                      <strong>{item.name}</strong>
                      <p className={cx('student__email')}>{item.email}</p>
                    </div>
                  </div>
                </td>
                <td>{item.mssv}</td>
                <td>{item.khoa}</td>
                <td>{item.lop}</td>
                <td>
                  <div className={cx('activity')}>
                    <strong>{item.hoatDong}</strong>
                    <p>
                      <CalendarDays size={14} /> {item.ngayHoatDong}
                    </p>
                  </div>
                </td>
                <td>{item.ngayGui}</td>
                <td>
                  <span className={cx('status-badge', getStatusClass(item.trangThai))}>{item.trangThai}</span>
                </td>
                <td>
                  <button className={cx('table__action-btn')}>
                    <Eye size={16} color="var(--primary-color)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
