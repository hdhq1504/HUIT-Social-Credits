import React, { useContext, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Table, Spin, Button, Modal, Descriptions, Tag, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEye } from '@fortawesome/free-solid-svg-icons';
import { TeacherPageContext } from '@/teacher/contexts/TeacherPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import teacherApi from '@/api/teacher.api';
import styles from './TeacherStudentDetailPage.module.scss';

const cx = classNames.bind(styles);

export default function TeacherStudentDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useContext(TeacherPageContext);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher', 'homeroom', 'class-students', classId],
    queryFn: () => teacherApi.getHomeroomClassStudents(classId),
    enabled: !!classId,
  });

  const { data: scoreData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['teacher', 'homeroom', 'student-scores', selectedStudent?.id],
    queryFn: () => teacherApi.getStudentScores(selectedStudent.id),
    enabled: !!selectedStudent,
  });

  useEffect(() => {
    if (data?.classInfo) {
      setBreadcrumbs([
        { label: 'Trang chủ', path: ROUTE_PATHS.TEACHER.DASHBOARD },
        { label: 'Lớp chủ nhiệm', path: ROUTE_PATHS.TEACHER.CLASSES },
        { label: `${data.classInfo.maLop} - ${data.classInfo.tenLop}` },
      ]);
    }
    return () => setBreadcrumbs(null);
  }, [setBreadcrumbs, data]);

  const handleViewScores = (student) => {
    setSelectedStudent(student);
    setIsScoreModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsScoreModalOpen(false);
    setSelectedStudent(null);
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'MSSV',
      dataIndex: 'maSV',
      key: 'maSV',
      width: 120,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'hoTen',
      key: 'hoTen',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gioiTinh',
      key: 'gioiTinh',
      width: 100,
      render: (value) => (value === 'Nam' ? 'Nam' : 'Nữ'),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'soDT',
      key: 'soDT',
      width: 130,
      render: (value) => value || '--',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem điểm">
          <Button type="link" icon={<FontAwesomeIcon icon={faEye} />} onClick={() => handleViewScores(record)} />
        </Tooltip>
      ),
    },
  ];

  const activityColumns = [
    {
      title: 'Tên hoạt động',
      dataIndex: ['hoatDong', 'ten'],
      key: 'activityName',
    },
    {
      title: 'Loại',
      dataIndex: ['hoatDong', 'loai'],
      key: 'loai',
      width: 150,
    },
    {
      title: 'Ngày tổ chức',
      dataIndex: ['hoatDong', 'ngayToChuc'],
      key: 'ngayToChuc',
      width: 120,
      render: (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : '--'),
    },
    {
      title: 'Điểm',
      dataIndex: ['hoatDong', 'diem'],
      key: 'diem',
      width: 80,
      align: 'center',
      render: (value) => value || 0,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      width: 120,
      align: 'center',
      render: (status) => {
        const statusMap = {
          APPROVED: { text: 'Đã duyệt', color: 'success' },
          PENDING: { text: 'Chờ duyệt', color: 'warning' },
          REJECTED: { text: 'Từ chối', color: 'error' },
        };
        const config = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Điểm danh',
      dataIndex: 'diemDanh',
      key: 'diemDanh',
      width: 100,
      align: 'center',
      render: (value) => (value ? <Tag color="success">Có mặt</Tag> : <Tag>Vắng</Tag>),
    },
  ];

  if (isLoading) {
    return (
      <div className={cx('student-detail__loading')}>
        <Spin size="large" />
      </div>
    );
  }

  const { students } = data || {};

  return (
    <div className={cx('student-detail')}>
      <div className={cx('student-detail__header')}>
        <Button
          icon={<FontAwesomeIcon icon={faArrowLeft} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASSES)}
          className={cx('student-detail__back-button')}
        >
          Quay lại
        </Button>
      </div>

      <div className={cx('student-detail__content')}>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} sinh viên`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={`Điểm hoạt động - ${selectedStudent?.hoTen}`}
        open={isScoreModalOpen}
        onCancel={handleCloseModal}
        width={1000}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Đóng
          </Button>,
        ]}
      >
        {isLoadingScores ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="MSSV">{scoreData?.student?.maSV}</Descriptions.Item>
              <Descriptions.Item label="Email">{scoreData?.student?.email}</Descriptions.Item>
              <Descriptions.Item label="Lớp" span={2}>
                {scoreData?.student?.lopHoc?.maLop} - {scoreData?.student?.lopHoc?.tenLop}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng điểm" span={2}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary-color)' }}>
                  {scoreData?.totalScore || 0} điểm
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Table
              columns={activityColumns}
              dataSource={scoreData?.activities || []}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
