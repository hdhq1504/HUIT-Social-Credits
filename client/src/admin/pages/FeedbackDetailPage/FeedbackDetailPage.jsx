import React from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Row, Col, Button, Breadcrumb, Card, Avatar, Tag, Space, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faXmark,
  faFileLines,
  faHourglassHalf,
  faCircleCheck,
  faCircleXmark,
  faUser,
  faStar,
  faUserGear,
  faCalendarDays,
  faMapPin,
  faUsers,
  faDownload,
  faFileImage,
  faChevronRight,
  faHome,
  faUserGraduate,
  faChalkboardUser,
  faPhone,
  faEnvelope,
  faIdCard,
} from '@fortawesome/free-solid-svg-icons';
import styles from './FeedbackDetailPage.module.scss';

const cx = classNames.bind(styles);

// --- DỮ LIỆU GIẢ LẬP (ĐÃ CHUYỂN VÀO TRONG FILE) ---
const feedbackDetailData = {
  id: '1',
  student: {
    name: 'Hà Huy Phong',
    avatar: 'https://placehold.co/150x150/E8EDFF/00008B?text=HP',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    phone: '0123 456 789',
    email: '2001223660@huit.edu.vn',
  },
  activity: {
    title: 'Hoạt động từ thiện cộng đồng - Trao tặng học bổng',
    type: 'Tình nguyện xã hội',
    points: 60,
    organizer: 'Nguyễn Văn An',
    location: 'Viện dưỡng lão Thành phố HCM',
    time: '08:00 - 17:00, 15/12/2024',
    participants: '45/50 sinh viên',
  },
  feedback: {
    content:
      'Em không được cộng điểm, đây là minh chứng em có tham giaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    status: 'Chờ xử lý',
    sentAt: '25/10/2024, 18:30',
    attachment: {
      name: 'Ảnh hoạt động.jpg',
      size: '1.8 MB',
      date: 'Tải lên 25/10/2024',
      url: '#',
    },
  },
};

const statsData = [
  {
    label: 'Tổng minh chứng',
    value: '2,847',
    color: '#00008B', // var(--primary-color)
    icon: <FontAwesomeIcon icon={faFileLines} />,
    bg: '#e8edff',
  },
  {
    label: 'Chờ duyệt',
    value: '456',
    color: '#DB7B00', // var(--warning-color)
    icon: <FontAwesomeIcon icon={faHourglassHalf} />,
    bg: '#fff3e0',
  },
  {
    label: 'Đã duyệt',
    value: '2,234',
    color: '#198754', // var(--success-color)
    icon: <FontAwesomeIcon icon={faCircleCheck} />,
    bg: '#e6f8ee',
  },
  {
    label: 'Từ chối',
    value: '157',
    color: '#DC3545', // var(--danger-color)
    icon: <FontAwesomeIcon icon={faCircleXmark} />,
    bg: '#fdeaea',
  },
];
// --- KẾT THÚC DỮ LIỆU GIẢ LẬP ---

// Helper render thông tin
const InfoItem = ({ icon, label, children }) => (
  <div className={cx('info-item')}>
    <span className={cx('info-item__icon')}>
      <FontAwesomeIcon icon={icon} />
    </span>
    <div className={cx('info-item__content')}>
      <span className={cx('info-item__label')}>{label}</span>
      <span className={cx('info-item__value')}>{children}</span>
    </div>
  </div>
);

// Helper render thẻ thống kê
const StatCard = ({ item }) => (
  <div className={cx('stat-card-mini')}>
    <div className={cx('stat-card-mini__info')}>
      <p className={cx('stat-card-mini__label')}>{item.label}</p>
      <h2 className={cx('stat-card-mini__value')} style={{ color: item.color }}>
        {item.value}
      </h2>
    </div>
    <div className={cx('stat-card-mini__icon-box')} style={{ backgroundColor: item.bg, color: item.color }}>
      {item.icon}
    </div>
  </div>
);

export default function FeedbackDetailPage() {
  const { id } = useParams();
  // Giả lập lấy dữ liệu chi tiết dựa trên ID
  const data = feedbackDetailData;

  if (!data) {
    return <div>Không tìm thấy phản hồi.</div>;
  }

  const { student, activity, feedback } = data;

  return (
    <ConfigProvider locale={viVN}>
      <div className={cx('detail-page')}>
        {/* Header */}
        <header className={cx('page-header')}>
          <div className={cx('page-header__left')}>
            <Breadcrumb className={cx('breadcrumb')} separator={<FontAwesomeIcon icon={faChevronRight} size="xs" />}>
              <Breadcrumb.Item>
                <Link to="/admin/dashboard">
                  <FontAwesomeIcon icon={faHome} /> Trang chủ
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Link to="/admin/feedback">Phản hồi sinh viên</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Chi tiết phản hồi</Breadcrumb.Item>
            </Breadcrumb>
            <h1 className={cx('page-title')}>Chi tiết phản hồi</h1>
          </div>
          <div className={cx('page-header__right')}>
            <Space size="middle">
              <Button type="primary" danger icon={<FontAwesomeIcon icon={faXmark} />} size="large">
                Từ chối
              </Button>
              <Button type="primary" icon={<FontAwesomeIcon icon={faCheck} />} size="large">
                Duyệt
              </Button>
            </Space>
          </div>
        </header>

        {/* Thống kê mini */}
        <section className={cx('stats-mini__grid')}>
          {statsData.map((item, index) => (
            <StatCard key={index} item={item} />
          ))}
        </section>

        {/* Nội dung chính */}
        <Row gutter={[24, 24]}>
          {/* Cột trái */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Thông tin hoạt động */}
              <Card title="Thông tin hoạt động" className={cx('info-card')}>
                <h3 className={cx('activity-title')}>{activity.title}</h3>
                <Tag color="blue" className={cx('activity-tag')}>
                  <FontAwesomeIcon icon={faStar} /> {activity.type}
                </Tag>
                <span className={cx('activity-points')}>
                  <strong>{activity.points}</strong> điểm
                </span>

                <div className={cx('info-grid')}>
                  <InfoItem icon={faUserGear} label="Người phụ trách">
                    {activity.organizer}
                  </InfoItem>
                  <InfoItem icon={faCalendarDays} label="Thời gian">
                    {activity.time}
                  </InfoItem>
                  <InfoItem icon={faMapPin} label="Địa điểm">
                    {activity.location}
                  </InfoItem>
                  <InfoItem icon={faUsers} label="Số lượng tham gia">
                    {activity.participants}
                  </InfoItem>
                </div>
              </Card>

              {/* Phản hồi sinh viên */}
              <Card title="Phản hồi sinh viên" className={cx('info-card')} extra={`Đã gửi: ${feedback.sentAt}`}>
                <div className={cx('feedback-content')}>
                  <h4>Nội dung phản hồi</h4>
                  <p>{feedback.content}</p>
                </div>
                <div className={cx('feedback-attachment')}>
                  <h4>File minh chứng đính kèm</h4>
                  <div className={cx('attachment-item')}>
                    <div className={cx('attachment-item__icon')}>
                      <FontAwesomeIcon icon={faFileImage} />
                    </div>
                    <div className={cx('attachment-item__info')}>
                      <strong>{feedback.attachment.name}</strong>
                      <span>
                        {feedback.attachment.size} - {feedback.attachment.date}
                      </span>
                    </div>
                    <a href={feedback.attachment.url} download>
                      <Button icon={<FontAwesomeIcon icon={faDownload} />} />
                    </a>
                  </div>
                </div>
                <div className={cx('feedback-status')}>
                  Trạng thái phản hồi: <Tag color="warning">{feedback.status}</Tag>
                </div>
              </Card>
            </Space>
          </Col>

          {/* Cột phải */}
          <Col xs={24} lg={8}>
            <Card title="Thông tin sinh viên" className={cx('info-card', 'student-info-card')}>
              <div className={cx('student-info__header')}>
                <Avatar size={80} src={student.avatar} />
                <h3 className={cx('student-info__name')}>{student.name}</h3>
              </div>
              <div className={cx('student-info__details')}>
                <InfoItem icon={faIdCard} label="Mã sinh viên">
                  {student.mssv}
                </InfoItem>
                <InfoItem icon={faUserGraduate} label="Khoa">
                  {student.khoa}
                </InfoItem>
                <InfoItem icon={faChalkboardUser} label="Lớp">
                  {student.lop}
                </InfoItem>
                <InfoItem icon={faPhone} label="Số điện thoại">
                  {student.phone}
                </InfoItem>
                <InfoItem icon={faEnvelope} label="Email">
                  {student.email}
                </InfoItem>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
}
