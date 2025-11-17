import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import councilApi, { COUNCIL_QUERY_KEYS } from '@/api/council.api';
import academicsApi, { ACADEMICS_QUERY_KEY } from '@/api/academics.api';
import useToast from '@/components/Toast/Toast';
import styles from './CouncilPage.module.scss';

const STATUS_TAGS = {
  PREPARING: { color: 'default', label: 'Đang chuẩn bị' },
  IN_PROGRESS: { color: 'processing', label: 'Đang xét' },
  FINALIZED: { color: 'success', label: 'Đã chốt' },
};

const statusTag = (status) => {
  const meta = STATUS_TAGS[status] || { color: 'default', label: status };
  return (
    <Tag color={meta.color} className={styles['council-page__status-tag']}>
      {meta.label}
    </Tag>
  );
};

export default function CouncilPage() {
  const [filters, setFilters] = useState({ academicYear: 'all', semesterLabel: 'all', status: 'all' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { contextHolder, open: openToast } = useToast();
  const { setPageActions } = useContext(AdminPageContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setPageActions([
      {
        key: 'create-council',
        label: 'Thành lập hội đồng',
        type: 'primary',
        onClick: () => setIsCreateModalOpen(true),
      },
    ]);
    return () => setPageActions(null);
  }, [setPageActions]);

  const { data: academics } = useQuery({
    queryKey: ACADEMICS_QUERY_KEY,
    queryFn: academicsApi.listSemesters,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: [...COUNCIL_QUERY_KEYS.base, filters],
    queryFn: () => councilApi.list(filters),
  });

  const createMutation = useMutation({
    mutationFn: (values) => councilApi.create(values),
    onSuccess: async () => {
      openToast({ message: 'Tạo hội đồng thành công!', variant: 'success' });
      setIsCreateModalOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.base });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể tạo hội đồng.', variant: 'danger' });
    },
  });

  const councils = data?.councils ?? [];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || 'all' }));
  };

  const columns = useMemo(
    () => [
      {
        title: 'Tên hội đồng',
        dataIndex: 'name',
        key: 'name',
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <span>{record.name}</span>
            <small>{record.description || '—'}</small>
          </Space>
        ),
      },
      {
        title: 'Năm học / Học kỳ',
        key: 'time',
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <span>{record.academicYear}</span>
            <small>{record.semesterLabel}</small>
          </Space>
        ),
      },
      {
        title: 'Khoa phụ trách',
        dataIndex: 'facultyCode',
        key: 'facultyCode',
        render: (value) => value || 'Toàn trường',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status) => statusTag(status),
      },
      {
        title: 'Số thành viên',
        dataIndex: 'membersCount',
        key: 'members',
        width: 130,
      },
      {
        title: 'Số sinh viên',
        dataIndex: 'studentCount',
        key: 'students',
        width: 130,
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '--'),
      },
    ],
    [],
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const selectedYear = yearOptions.find((year) => year.id === values.namHocId);
      const selectedSemester = semesterOptions.find((semester) => semester.id === values.hocKyId);
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description,
        facultyCode: values.facultyCode,
        namHocId: values.namHocId,
        hocKyId: values.hocKyId,
        academicYear: selectedYear?.nienKhoa || selectedYear?.ten || selectedYear?.ma || 'Năm học',
        semester: selectedSemester?.ten || selectedSemester?.ma || 'Học kỳ',
      });
    } catch (error) {
      if (!error?.errorFields) {
        openToast({ message: 'Không thể tạo hội đồng.', variant: 'danger' });
      }
    }
  };

  const yearOptions = academics?.academicYears ?? [];
  const semesterOptions = academics?.semesters ?? [];
  const formattedYearOptions = yearOptions.map((year) => ({
    value: year.nienKhoa || year.ten || year.ma || year.id,
    label: year.ten || year.nienKhoa || year.ma || 'Năm học',
  }));
  const formattedSemesterOptions = semesterOptions.map((semester) => ({
    value: semester.ten || semester.ma || semester.id,
    label: semester.ten || semester.ma || 'Học kỳ',
  }));

  return (
    <div className={styles['council-page']}>
      {contextHolder}
      <Card>
        <Space className={styles['council-page__filters']}>
          <Select
            placeholder="Năm học"
            value={filters.academicYear}
            style={{ minWidth: 160 }}
            onChange={(value) => handleFilterChange('academicYear', value)}
            options={[{ value: 'all', label: 'Tất cả' }, ...formattedYearOptions]}
          />
          <Select
            placeholder="Học kỳ"
            value={filters.semesterLabel}
            style={{ minWidth: 140 }}
            onChange={(value) => handleFilterChange('semesterLabel', value)}
            options={[{ value: 'all', label: 'Tất cả' }, ...formattedSemesterOptions]}
          />
          <Select
            placeholder="Trạng thái"
            value={filters.status}
            style={{ minWidth: 140 }}
            onChange={(value) => handleFilterChange('status', value)}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'PREPARING', label: 'Đang chuẩn bị' },
              { value: 'IN_PROGRESS', label: 'Đang xét' },
              { value: 'FINALIZED', label: 'Đã chốt' },
            ]}
          />
        </Space>
      </Card>

      <Card className={styles['council-page__table-card']}>
        <Table
          rowKey="id"
          dataSource={councils}
          columns={columns}
          loading={isLoading}
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`${ROUTE_PATHS.ADMIN.COUNCIL}/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
        <div className={styles['council-page__footer-text']}>
          Tổng số hội đồng: <strong>{councils.length}</strong>
        </div>
      </Card>

      <Modal
        title="Thành lập hội đồng xét điểm"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText="Tạo hội đồng"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên hội đồng"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên hội đồng' }]}
          >
            <Input placeholder="Ví dụ: Hội đồng xét điểm CTXH HK1" />
          </Form.Item>
          <Form.Item label="Năm học" name="namHocId" rules={[{ required: true, message: 'Vui lòng chọn năm học' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={yearOptions.map((year) => ({
                value: year.id,
                label: year.ten || year.nienKhoa || year.ma,
              }))}
            />
          </Form.Item>
          <Form.Item label="Học kỳ" name="hocKyId" rules={[{ required: true, message: 'Vui lòng chọn học kỳ' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={semesterOptions.map((semester) => ({
                value: semester.id,
                label: semester.ten,
              }))}
            />
          </Form.Item>
          <Form.Item label="Khoa / lớp phụ trách" name="facultyCode">
            <Input placeholder="Nhập mã khoa nếu có" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm về hội đồng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
