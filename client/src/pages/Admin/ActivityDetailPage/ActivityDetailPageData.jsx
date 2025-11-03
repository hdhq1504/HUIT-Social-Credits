import React from 'react';
import { Eye } from 'lucide-react';
import styles from './ActivityDetailPage.module.scss';

const ActivityDetailPageData = ({ activeTab }) => {
  // ================== DỮ LIỆU GIẢ ==================
  const studentList = [
    {
      id: 1,
      name: 'Nguyễn Minh Anh',
      email: 'minhanh@huit.edu.vn',
      mssv: 'SV001',
      faculty: 'Công nghệ thông tin',
      class: '13DHTH01',
      registerTime: '10/12/2024 08:30',
      status: 'Đang tham gia',
      avatar: 'https://i.pravatar.cc/50?img=1',
    },
    {
      id: 2,
      name: 'Trần Hoàng Long',
      email: 'hoanglong@huit.edu.vn',
      mssv: 'SV002',
      faculty: 'Công nghệ thông tin',
      class: '13DHTH02',
      registerTime: '11/12/2024 09:00',
      status: 'Đã đăng ký',
      avatar: 'https://i.pravatar.cc/50?img=2',
    },
    {
      id: 3,
      name: 'Phạm Thu Thảo',
      email: 'thuthao@huit.edu.vn',
      mssv: 'SV003',
      faculty: 'Công nghệ thông tin',
      class: '13DHTH03',
      registerTime: '12/12/2024 14:15',
      status: 'Đã tham gia',
      avatar: 'https://i.pravatar.cc/50?img=3',
    },
    {
      id: 4,
      name: 'Lê Văn Tài',
      email: 'tai.le@huit.edu.vn',
      mssv: 'SV004',
      faculty: 'Công nghệ thông tin',
      class: '13DHTH04',
      registerTime: '12/12/2024 16:20',
      status: 'Vắng mặt',
      avatar: 'https://i.pravatar.cc/50?img=4',
    },
  ];

  // ================== HIỂN THỊ THEO TAB ==================
  switch (activeTab) {
    case 'info':
      return (
        <div className={styles['activity-detail__info']}>
          <h3 className={styles['activity-detail__section-title']}>Mô tả</h3>
          <p className={styles['activity-detail__text']}>
            Chiến dịch <b>"Sạch biển xanh - Tương lai bền vững"</b> là hoạt động tình nguyện nhằm nâng cao ý thức cộng
            đồng về ô nhiễm rác thải nhựa.
          </p>

          <h3 className={styles['activity-detail__section-title']}>Quyền lợi khi tham gia</h3>
          <ul className={styles['activity-detail__list']}>
            <li>✔ Nhận 60 điểm hoạt động CTXH</li>
            <li>✔ Giấy chứng nhận từ Ban tổ chức</li>
            <li>✔ Hỗ trợ ăn uống, di chuyển 100%</li>
            <li>✔ Áo đồng phục và vật phẩm kỷ niệm</li>
            <li>✔ Giao lưu với sinh viên các trường</li>
          </ul>

          <h3 className={styles['activity-detail__section-title']}>Trách nhiệm người tham gia</h3>
          <ul className={styles['activity-detail__list']}>
            <li>⚠ Tham gia đầy đủ hoạt động theo lịch</li>
            <li>⚠ Tuân thủ quy định an toàn</li>
          </ul>

          <h3 className={styles['activity-detail__section-title']}>Yêu cầu tham gia</h3>
          <ul className={styles['activity-detail__list']}>
            <li>📄 Là sinh viên đang học đại học, cao đẳng</li>
            <li>📄 Có bảo hiểm y tế và sức khỏe tốt</li>
            <li>📄 Cam kết tham gia đủ 2 ngày (T7 - CN)</li>
          </ul>
        </div>
      );

    case 'students':
      return (
        <div className={styles['activity-detail__students']}>
          <h1 className={styles['activity-detail__back-btn']}>Danh sách sinh viên</h1>

          <div className={styles['activity-detail__table-container']}>
            <table className={styles['activity-detail__table']}>
              <thead>
                <tr>
                  <th></th>
                  <th>STT</th>
                  <th>Sinh viên</th>
                  <th>MSSV</th>
                  <th>Khoa</th>
                  <th>Lớp</th>
                  <th>Thời gian đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {studentList.map((student, index) => (
                  <tr key={student.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles['activity-detail__student-info']}>
                        <img src={student.avatar} alt={student.name} className={styles['activity-detail__avatar']} />
                        <div>
                          <p className={styles['activity-detail__name']}>{student.name}</p>
                          <p className={styles['activity-detail__email']}>{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{student.mssv}</td>
                    <td>{student.faculty}</td>
                    <td>{student.class}</td>
                    <td>{student.registerTime}</td>
                    <td>
                      <span
                        className={`${styles['activity-detail__status']} ${styles[`activity-detail__status--${getStatusClass(student.status)}`]}`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles['activity-detail__view-btn']}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'feedback':
      return (
        <div className={styles['activity-detail__placeholder']}>
          Nội dung <b>Nhật ký phản hồi</b> sẽ được hiển thị ở đây.
        </div>
      );

    default:
      return null;
  }
};

// ================== HÀM PHỤ TRỢ ==================
const getStatusClass = (status) => {
  switch (status) {
    case 'Đang tham gia':
      return 'active';
    case 'Đã đăng ký':
      return 'pending';
    case 'Đã tham gia':
      return 'success';
    case 'Vắng mặt':
      return 'absent';
    default:
      return '';
  }
};

export default ActivityDetailPageData;
