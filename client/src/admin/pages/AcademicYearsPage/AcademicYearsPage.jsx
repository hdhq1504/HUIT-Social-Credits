import React, { useContext, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, DatePicker, message, Popconfirm, Tag, Collapse } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import academicApi from '@/api/academic.api';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import styles from './AcademicYearsPage.module.scss';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export default function AcademicYearsPage() {
  const queryClient = useQueryClient();
  const { setPageActions, setBreadcrumbs } = useContext(AdminPageContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [selectedYearForSemesters, setSelectedYearForSemesters] = useState(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'academic-years'],
    queryFn: () => academicApi.getNamHocs({ page: 1, pageSize: 100 }),
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Cấu hình năm học, học kỳ', path: ROUTE_PATHS.ADMIN.ACADEMIC_YEARS },
    ]);
    setPageActions([
      {
        key: 'create',
        label: 'Tạo năm học mới',
        type: 'primary',
        className: 'admin-navbar__add-button',
        icon: <FontAwesomeIcon icon={faPlus} />,
        onClick: () => setIsModalOpen(true),
      },
    ]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setBreadcrumbs, setPageActions]);

  const createMutation = useMutation({
    mutationFn: academicApi.createNamHoc,
    onSuccess: () => {
      message.success('Tạo năm học thành công');
      queryClient.invalidateQueries(['admin', 'academic-years']);
      handleCloseModal();
    },
    onError: (error) => {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academicApi.updateNamHoc(id, data),
    onSuccess: () => {
      message.success('Cập nhật năm học thành công');
      queryClient.invalidateQueries(['admin', 'academic-years']);
      handleCloseModal();
    },
    onError: (error) => {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: academicApi.deleteNamHoc,
    onSuccess: () => {
      message.success('Xóa năm học thành công');
      queryClient.invalidateQueries(['admin', 'academic-years']);
    },
    onError: (error) => {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    },
  });

  const activateMutation = useMutation({
    mutationFn: academicApi.activateNamHoc,
    onSuccess: () => {
      message.success('Kích hoạt năm học thành công');
      queryClient.invalidateQueries(['admin', 'academic-years']);
    },
    onError: (error) => {
      message.error(error.response?.data?.error || 'Có lỗi xảy ra');
    },
  });

  const handleOpenModal = (year = null) => {
    setEditingYear(year);
    if (year) {
      form.setFieldsValue({
        ma: year.ma,
        nienKhoa: year.nienKhoa,
        ten: year.ten,
        dateRange: [dayjs(year.batDau), dayjs(year.ketThuc)],
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYear(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    const [batDau, ketThuc] = values.dateRange;
    const payload = {
      ma: values.ma,
      nienKhoa: values.nienKhoa,
      ten: values.ten,
      batDau: batDau.toISOString(),
      ketThuc: ketThuc.toISOString(),
    };

    if (editingYear) {
      updateMutation.mutate({ id: editingYear.id, data: payload });
    } else {
      // Create year and automatically create 3 semesters
      createMutation.mutate(payload, {
        onSuccess: async (response) => {
          const yearId = response.namHoc.id;
          const yearStart = dayjs(batDau);
          const yearEnd = dayjs(ketThuc);

          // Auto-create 3 semesters
          const semesters = [
            {
              ma: `${values.ma}-HK1`,
              ten: 'Học kỳ 1',
              thuTu: 1,
              batDau: yearStart.toISOString(),
              ketThuc: yearStart.add(4, 'month').toISOString(),
            },
            {
              ma: `${values.ma}-HK2`,
              ten: 'Học kỳ 2',
              thuTu: 2,
              batDau: yearStart.add(4, 'month').add(1, 'day').toISOString(),
              ketThuc: yearStart.add(8, 'month').toISOString(),
            },
            {
              ma: `${values.ma}-HK3`,
              ten: 'Học kỳ 3',
              thuTu: 3,
              batDau: yearStart.add(8, 'month').add(1, 'day').toISOString(),
              ketThuc: yearEnd.toISOString(),
            },
          ];

          try {
            await Promise.all(semesters.map((sem) => academicApi.createHocKy(yearId, sem)));
            message.success('Đã tạo 3 học kỳ tự động');
            queryClient.invalidateQueries(['admin', 'academic-years']);
          } catch {
            message.warning('Năm học đã tạo nhưng có lỗi khi tạo học kỳ');
          }
        },
      });
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleActivate = (id) => {
    activateMutation.mutate(id);
  };

  const handleManageSemesters = (year) => {
    setSelectedYearForSemesters(year);
    setSemesterModalOpen(true);
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'ma',
      key: 'ma',
      width: 100,
    },
    {
      title: 'Niên khóa',
      dataIndex: 'nienKhoa',
      key: 'nienKhoa',
      width: 150,
    },
    {
      title: 'Tên năm học',
      dataIndex: 'ten',
      key: 'ten',
      width: 200,
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <span>
          {dayjs(record.batDau).format('DD/MM/YYYY')} - {dayjs(record.ketThuc).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Số học kỳ',
      dataIndex: ['_count', 'hocKy'],
      key: 'semesterCount',
      width: 100,
      align: 'center',
      render: (count, record) => (
        <Button type="link" onClick={() => handleManageSemesters(record)}>
          {count || 0} học kỳ
        </Button>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      render: (isActive) =>
        isActive ? (
          <Tag color="success" icon={<FontAwesomeIcon icon={faCheck} />}>
            Đang áp dụng
          </Tag>
        ) : (
          <Tag>Không hoạt động</Tag>
        ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <div className={cx('actions')}>
          {!record.isActive && (
            <Button
              type="link"
              size="small"
              onClick={() => handleActivate(record.id)}
              loading={activateMutation.isLoading}
            >
              Kích hoạt
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa năm học"
            description="Bạn có chắc chắn muốn xóa năm học này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<FontAwesomeIcon icon={faTrash} />}
              loading={deleteMutation.isLoading}
            >
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className={cx('academic-years')}>
      <div className={cx('academic-years__content')}>
        <Table columns={columns} dataSource={data?.namHocs || []} rowKey="id" loading={isLoading} pagination={false} />
      </div>

      <Modal
        title={editingYear ? 'Chỉnh sửa năm học' : 'Thêm năm học mới'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="ma" label="Mã năm học" rules={[{ required: true, message: 'Vui lòng nhập mã năm học' }]}>
            <Input placeholder="VD: 2024-2025" />
          </Form.Item>

          <Form.Item name="nienKhoa" label="Niên khóa" rules={[{ required: true, message: 'Vui lòng nhập niên khóa' }]}>
            <Input placeholder="VD: 2024-2025" />
          </Form.Item>

          <Form.Item name="ten" label="Tên năm học">
            <Input placeholder="VD: Năm học 2024-2025" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Form.Item>

          {!editingYear && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#0369a1' }}>
                💡 Hệ thống sẽ tự động tạo 3 học kỳ cho năm học này
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCloseModal}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingYear ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </Form>
      </Modal>

      <SemesterManagementModal
        open={semesterModalOpen}
        year={selectedYearForSemesters}
        onClose={() => {
          setSemesterModalOpen(false);
          setSelectedYearForSemesters(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries(['admin', 'academic-years']);
        }}
      />
    </div>
  );
}

// Semester Management Modal Component
function SemesterManagementModal({ open, year, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [editingSemester, setEditingSemester] = useState(null);
  const [semesterForm] = Form.useForm();

  const { data: semesters, isLoading } = useQuery({
    queryKey: ['admin', 'semesters', year?.id],
    queryFn: () => academicApi.getHocKys(year.id),
    enabled: !!year,
  });

  const createSemesterMutation = useMutation({
    mutationFn: ({ namHocId, data }) => academicApi.createHocKy(namHocId, data),
    onSuccess: () => {
      message.success('Tạo học kỳ thành công');
      queryClient.invalidateQueries(['admin', 'semesters', year?.id]);
      queryClient.invalidateQueries(['admin', 'academic-years']);
      setEditingSemester(null);
      semesterForm.resetFields();
      onSuccess?.();
    },
  });

  const updateSemesterMutation = useMutation({
    mutationFn: ({ id, data }) => academicApi.updateHocKy(id, data),
    onSuccess: () => {
      message.success('Cập nhật học kỳ thành công');
      queryClient.invalidateQueries(['admin', 'semesters', year?.id]);
      setEditingSemester(null);
      semesterForm.resetFields();
      onSuccess?.();
    },
  });

  const deleteSemesterMutation = useMutation({
    mutationFn: academicApi.deleteHocKy,
    onSuccess: () => {
      message.success('Xóa học kỳ thành công');
      queryClient.invalidateQueries(['admin', 'semesters', year?.id]);
      queryClient.invalidateQueries(['admin', 'academic-years']);
      onSuccess?.();
    },
  });

  const handleEditSemester = (semester) => {
    setEditingSemester(semester);
    semesterForm.setFieldsValue({
      ma: semester.ma,
      ten: semester.ten,
      thuTu: semester.thuTu,
      moTa: semester.moTa,
      dateRange: [dayjs(semester.batDau), dayjs(semester.ketThuc)],
    });
  };

  const handleSubmitSemester = (values) => {
    const [batDau, ketThuc] = values.dateRange;
    const payload = {
      ma: values.ma,
      ten: values.ten,
      thuTu: values.thuTu,
      moTa: values.moTa,
      batDau: batDau.toISOString(),
      ketThuc: ketThuc.toISOString(),
    };

    if (editingSemester) {
      updateSemesterMutation.mutate({ id: editingSemester.id, data: payload });
    } else {
      createSemesterMutation.mutate({ namHocId: year.id, data: payload });
    }
  };

  const handleCancelEdit = () => {
    setEditingSemester(null);
    semesterForm.resetFields();
  };

  return (
    <Modal title={`Quản lý học kỳ - ${year?.nienKhoa}`} open={open} onCancel={onClose} footer={null} width={800}>
      <div style={{ marginBottom: 16 }}>
        {semesters?.map((semester) => (
          <div
            key={semester.id}
            style={{ marginBottom: 12, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{semester.ten}</h4>
                <p style={{ margin: '4px 0', color: '#8c8c8c', fontSize: 14 }}>
                  {dayjs(semester.batDau).format('DD/MM/YYYY')} - {dayjs(semester.ketThuc).format('DD/MM/YYYY')}
                </p>
              </div>
              <div>
                <Button
                  type="link"
                  size="small"
                  icon={<FontAwesomeIcon icon={faEdit} />}
                  onClick={() => handleEditSemester(semester)}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa học kỳ"
                  description="Bạn có chắc chắn muốn xóa học kỳ này?"
                  onConfirm={() => deleteSemesterMutation.mutate(semester.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="link" danger size="small" icon={<FontAwesomeIcon icon={faTrash} />}>
                    Xóa
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingSemester && (
        <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
          <h4>Chỉnh sửa học kỳ</h4>
          <Form form={semesterForm} layout="vertical" onFinish={handleSubmitSemester}>
            <Form.Item name="ma" label="Mã học kỳ" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="ten" label="Tên học kỳ" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="thuTu" label="Thứ tự" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="moTa" label="Mô tả">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="dateRange" label="Thời gian" rules={[{ required: true }]}>
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleCancelEdit}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={updateSemesterMutation.isLoading}>
                Cập nhật
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
}
