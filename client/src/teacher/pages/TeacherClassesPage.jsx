import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Space, Typography, Spin, Alert } from 'antd';
import { TeamOutlined, BookOutlined } from '@ant-design/icons';
import { getMyClasses } from '@/api/teacher.api';

const { Title, Text } = Typography;

export default function TeacherClassesPage() {
  const navigate = useNavigate();

  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: getMyClasses,
  });

  const columns = [
    {
      title: 'Mã lớp',
      dataIndex: 'maLop',
      key: 'maLop',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tên lớp',
      dataIndex: 'tenLop',
      key: 'tenLop',
    },
    {
      title: 'Khoa',
      dataIndex: ['khoa', 'tenKhoa'],
      key: 'khoa',
    },
    {
      title: 'Năm nhập học',
      dataIndex: 'namNhapHoc',
      key: 'namNhapHoc',
      width: 120,
      align: 'center',
      render: (year) => <Tag color="blue">{year}</Tag>,
    },
    {
      title: 'Sĩ số',
      dataIndex: ['_count', 'sinhVien'],
      key: 'siSo',
      width: 100,
      align: 'center',
      render: (count) => (
        <Space>
          <TeamOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => <a onClick={() => navigate(`/teacher/classes/${record.id}`)}>Xem chi tiết</a>,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Lỗi" description="Không thể tải danh sách lớp học" type="error" showIcon />;
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <BookOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Lớp chủ nhiệm
            </Title>
          </Space>
        }
        extra={<Tag color="green">{classes?.length || 0} lớp</Tag>}
      >
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lớp`,
          }}
        />
      </Card>
    </div>
  );
}
