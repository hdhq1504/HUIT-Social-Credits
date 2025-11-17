import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import councilApi, { COUNCIL_QUERY_KEYS } from '@/api/council.api';
import academicsApi, { ACADEMICS_QUERY_KEY } from '@/api/academics.api';
import useToast from '@/components/Toast/Toast';
import useDebounce from '@/hooks/useDebounce';
import styles from './CouncilDetailPage.module.scss';

const STATUS_TEXT = {
  PREPARING: { color: 'default', label: 'Đang chuẩn bị' },
  IN_PROGRESS: { color: 'processing', label: 'Đang xét' },
  FINALIZED: { color: 'success', label: 'Đã chốt' },
};

const RESULT_TAG = {
  PENDING: { color: 'default', label: 'Chờ xét' },
  PASSED: { color: 'success', label: 'Đạt' },
  FAILED: { color: 'error', label: 'Không đạt' },
};

const buildStatusTag = (status) => {
  const meta = STATUS_TEXT[status] || { color: 'default', label: status };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

const buildResultTag = (result) => {
  const meta = RESULT_TAG[result] || { color: 'default', label: result };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

const studentResultOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xét' },
  { value: 'PASSED', label: 'Đạt' },
  { value: 'FAILED', label: 'Không đạt' },
];

export default function CouncilDetailPage() {
  const { id } = useParams();
  const { setBreadcrumbs } = useContext(AdminPageContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contextHolder, open: openToast } = useToast();

  const [editForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [importForm] = Form.useForm();
  const [noteForm] = Form.useForm();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');
  const debouncedMemberSearch = useDebounce(memberSearch, 300);

  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 400);
  const [studentFilters, setStudentFilters] = useState({ result: 'all', classCode: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: COUNCIL_QUERY_KEYS.detail(id),
    queryFn: () => councilApi.detail(id),
    enabled: Boolean(id),
  });

  const { data: academics } = useQuery({
    queryKey: ACADEMICS_QUERY_KEY,
    queryFn: academicsApi.listSemesters,
    staleTime: 5 * 60 * 1000,
  });

  const { data: eligibleMembers = [] } = useQuery({
    queryKey: COUNCIL_QUERY_KEYS.eligibleMembers(debouncedMemberSearch),
    queryFn: () => councilApi.searchMembers(debouncedMemberSearch),
    enabled: isMemberModalOpen,
  });

  const { data: studentData, isLoading: isStudentsLoading } = useQuery({
    queryKey: COUNCIL_QUERY_KEYS.students(id, {
      result: studentFilters.result,
      classCode: studentFilters.classCode,
      search: debouncedStudentSearch,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
    queryFn: () =>
      councilApi.listStudents(id, {
        result: studentFilters.result,
        classCode: studentFilters.classCode,
        search: debouncedStudentSearch,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (detail?.name) {
      setBreadcrumbs([{ path: ROUTE_PATHS.ADMIN.COUNCIL, label: 'Hội đồng' }, { label: detail.name }]);
      editForm.setFieldsValue({
        name: detail.name,
        description: detail.description,
        facultyCode: detail.facultyCode,
      });
    }
    return () => setBreadcrumbs(null);
  }, [detail, setBreadcrumbs, editForm]);

  const isFinalized = detail?.status === 'FINALIZED';

  const yearOptions = academics?.academicYears ?? [];
  const semesterOptions = academics?.semesters ?? [];

  const studentRows = studentData?.items ?? [];
  const paginationMeta = studentData?.pagination ?? { page: 1, pageSize: 20, total: 0 };
  const studentSummary = studentData?.summary ?? { pending: 0, passed: 0, failed: 0, total: 0 };

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const detailRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.detail(id) });
    await queryClient.invalidateQueries({ queryKey: ['councils', id, 'students'], exact: false });
  };

  const updateCouncilMutation = useMutation({
    mutationFn: (values) => councilApi.update(id, values),
    onSuccess: async () => {
      openToast({ message: 'Đã cập nhật thông tin hội đồng.', variant: 'success' });
      setIsEditModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.detail(id) });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể cập nhật.', variant: 'danger' });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => councilApi.finalize(id),
    onSuccess: async () => {
      openToast({ message: 'Đã chốt kết quả hội đồng.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.detail(id) });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể chốt kết quả.', variant: 'danger' });
    },
  });

  const memberMutation = useMutation({
    mutationFn: (values) => councilApi.addMembers(id, { members: [values] }),
    onSuccess: async () => {
      openToast({ message: 'Đã thêm thành viên.', variant: 'success' });
      setIsMemberModalOpen(false);
      memberForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.detail(id) });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể thêm thành viên.', variant: 'danger' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => councilApi.removeMember(id, memberId),
    onSuccess: async () => {
      openToast({ message: 'Đã xóa thành viên.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.detail(id) });
    },
    onError: () => {
      openToast({ message: 'Không thể xóa thành viên.', variant: 'danger' });
    },
  });

  const importStudentsMutation = useMutation({
    mutationFn: (values) => councilApi.importStudents(id, values),
    onSuccess: async (result) => {
      openToast({ message: `Đã nạp ${result.imported} sinh viên.`, variant: 'success' });
      setIsImportModalOpen(false);
      importForm.resetFields();
      await detailRefetch();
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể nạp sinh viên.', variant: 'danger' });
    },
  });

  const updateStudentsMutation = useMutation({
    mutationFn: ({ ids, payload }) =>
      Promise.all(ids.map((evaluationId) => councilApi.updateStudent(id, evaluationId, payload))),
    onSuccess: async () => {
      openToast({ message: 'Đã cập nhật kết quả xét duyệt.', variant: 'success' });
      setSelectedRowKeys([]);
      setNoteModalOpen(false);
      noteForm.resetFields();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.students(id, undefined) }),
        queryClient.invalidateQueries({ queryKey: COUNCIL_QUERY_KEYS.detail(id) }),
      ]);
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể cập nhật kết quả.', variant: 'danger' });
    },
  });

  const handleUpdateCouncil = async () => {
    try {
      const values = await editForm.validateFields();
      await updateCouncilMutation.mutateAsync(values);
    } catch (error) {
      if (!error?.errorFields) {
        openToast({ message: 'Thông tin chưa hợp lệ.', variant: 'danger' });
      }
    }
  };

  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      await memberMutation.mutateAsync(values);
    } catch (error) {
      if (!error?.errorFields) {
        openToast({ message: 'Không thể thêm thành viên.', variant: 'danger' });
      }
    }
  };

  const handleImportStudents = async () => {
    try {
      const values = await importForm.validateFields();
      await importStudentsMutation.mutateAsync(values);
    } catch (error) {
      if (!error?.errorFields) {
        openToast({ message: 'Vui lòng kiểm tra thông tin nạp sinh viên.', variant: 'danger' });
      }
    }
  };

  const handleBulkUpdate = async (result, note) => {
    if (!selectedRowKeys.length) {
      openToast({ message: 'Vui lòng chọn sinh viên.', variant: 'warning' });
      return;
    }
    await updateStudentsMutation.mutateAsync({ ids: selectedRowKeys, payload: { result, note } });
  };

  const handleFinalize = () => {
    finalizeMutation.mutate();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await councilApi.exportPdf(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bien-ban-hoi-dong-${detail?.academicYear || 'nam-hoc'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      openToast({ message: 'Đã tải biên bản hội đồng.', variant: 'success' });
    } catch (error) {
      openToast({ message: error.response?.data?.error || 'Không thể xuất PDF.', variant: 'danger' });
    } finally {
      setExporting(false);
    }
  };

  const memberColumns = [
    {
      title: 'Thành viên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <span>{value || 'Chưa cập nhật'}</span>
          <small>{record.email}</small>
        </Space>
      ),
    },
    {
      title: 'Vai trò hệ thống',
      dataIndex: 'systemRole',
      key: 'systemRole',
      width: 140,
      render: (role) => role || '—',
    },
    {
      title: 'Vai trò trong hội đồng',
      dataIndex: 'roleInCouncil',
      key: 'roleInCouncil',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Xóa thành viên này?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => removeMemberMutation.mutate(record.id)}
          disabled={isFinalized}
        >
          <Button type="link" danger disabled={isFinalized || removeMemberMutation.isPending}>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const studentColumns = [
    {
      title: 'Sinh viên',
      dataIndex: 'student',
      key: 'student',
      render: (student) => (
        <Space direction="vertical" size={0}>
          <span>{student?.fullName || 'Chưa cập nhật'}</span>
          <small>{student?.studentCode || '--'}</small>
        </Space>
      ),
    },
    {
      title: 'Lớp',
      dataIndex: ['student', 'classCode'],
      key: 'classCode',
      width: 120,
      render: (value) => value || '—',
    },
    {
      title: 'Khoa',
      dataIndex: ['student', 'facultyCode'],
      key: 'facultyCode',
      width: 120,
      render: (value) => value || '—',
    },
    {
      title: 'Điểm CTXH',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      width: 120,
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 140,
      render: (result) => buildResultTag(result),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (value) => value || '—',
    },
    {
      title: 'Cập nhật bởi',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: (user) => user?.fullName || '—',
    },
    {
      title: 'Thời gian',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—'),
    },
  ];

  const summaryCards = (
    <Row gutter={16} className={styles['council-detail__summary-cards']}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Chưa xét" value={studentSummary.pending || 0} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Đạt" value={studentSummary.passed || 0} valueStyle={{ color: '#16a34a' }} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Không đạt" value={studentSummary.failed || 0} valueStyle={{ color: '#dc2626' }} />
        </Card>
      </Col>
    </Row>
  );

  const renderOverview = () => (
    <div className={styles['council-detail__tab-content']}>
      <Card>
        <div className={styles['council-detail__header']}>
          <div>
            <h2>{detail?.name}</h2>
            <p>{detail?.description || 'Chưa có mô tả cho hội đồng này.'}</p>
          </div>
          <Space wrap>
            {buildStatusTag(detail?.status)}
            <Button onClick={() => setIsEditModalOpen(true)} disabled={isFinalized}>
              Chỉnh sửa
            </Button>
            <Button type="primary" onClick={handleFinalize} disabled={isFinalized} loading={finalizeMutation.isPending}>
              Chốt kết quả
            </Button>
          </Space>
        </div>
        <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Năm học">{detail?.academicYear || '—'}</Descriptions.Item>
          <Descriptions.Item label="Học kỳ">{detail?.semesterLabel || '—'}</Descriptions.Item>
          <Descriptions.Item label="Khoa phụ trách">{detail?.facultyCode || 'Toàn trường'}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {detail?.createdAt ? dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
          </Descriptions.Item>
        </Descriptions>
        {summaryCards}
      </Card>
    </div>
  );

  const renderMembers = () => (
    <div className={styles['council-detail__tab-content']}>
      <Card>
        <div className={styles['council-detail__members-actions']}>
          <h3>Thành viên ({detail?.members?.length || 0})</h3>
          <Button type="primary" onClick={() => setIsMemberModalOpen(true)} disabled={isFinalized}>
            Thêm thành viên
          </Button>
        </div>
        <Table
          rowKey="id"
          dataSource={detail?.members || []}
          columns={memberColumns}
          pagination={false}
          locale={{ emptyText: <Empty description="Chưa có thành viên" /> }}
        />
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className={styles['council-detail__tab-content']}>
      <Card>
        <div className={styles['council-detail__students-actions']}>
          <Space className={styles['council-detail__filters']}>
            <Select
              style={{ minWidth: 160 }}
              value={studentFilters.result}
              onChange={(value) => {
                setStudentFilters((prev) => ({ ...prev, result: value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={studentResultOptions}
            />
            <Input
              placeholder="Lớp"
              value={studentFilters.classCode}
              onChange={(event) => {
                setStudentFilters((prev) => ({ ...prev, classCode: event.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ width: 140 }}
            />
            <Input
              placeholder="Tìm theo MSSV hoặc tên"
              allowClear
              value={studentSearch}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ minWidth: 220 }}
            />
          </Space>
          <Space>
            <Button onClick={() => setIsImportModalOpen(true)} disabled={isFinalized}>
              Nạp sinh viên
            </Button>
            <Button
              type="primary"
              disabled={!selectedRowKeys.length || isFinalized}
              loading={updateStudentsMutation.isPending}
              onClick={() => handleBulkUpdate('PASSED')}
            >
              Đánh dấu Đạt
            </Button>
            <Button
              danger
              disabled={!selectedRowKeys.length || isFinalized}
              loading={updateStudentsMutation.isPending}
              onClick={() => setNoteModalOpen(true)}
            >
              Đánh dấu Không đạt
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={isStudentsLoading}
          dataSource={studentRows}
          columns={studentColumns}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: paginationMeta.page,
            pageSize: paginationMeta.pageSize,
            total: paginationMeta.total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: <Empty description="Chưa có sinh viên" /> }}
        />
      </Card>
    </div>
  );

  const renderExport = () => (
    <div className={styles['council-detail__tab-content']}>
      <Card>
        <Space direction="vertical" size="large">
          <p>
            Xuất biên bản xét duyệt để lưu trữ và trình ký. Vui lòng đảm bảo hội đồng đã chốt kết quả trước khi xuất
            PDF.
          </p>
          <Button type="primary" onClick={handleExport} disabled={!isFinalized} loading={exporting}>
            Xuất PDF
          </Button>
        </Space>
      </Card>
    </div>
  );

  if (isDetailLoading) {
    return (
      <div className={styles['council-detail']}>
        {contextHolder}
        <Spin />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles['council-detail']}>
        {contextHolder}
        <Empty description="Không tìm thấy hội đồng" />
        <Button type="primary" onClick={() => navigate(ROUTE_PATHS.ADMIN.COUNCIL)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className={styles['council-detail']}>
      {contextHolder}
      <Tabs
        defaultActiveKey="overview"
        items={[
          { key: 'overview', label: 'Tổng quan', children: renderOverview() },
          { key: 'members', label: 'Thành viên', children: renderMembers() },
          { key: 'students', label: 'Sinh viên', children: renderStudents() },
          { key: 'export', label: 'Biên bản & PDF', children: renderExport() },
        ]}
      />

      <Modal
        title="Chỉnh sửa hội đồng"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={handleUpdateCouncil}
        confirmLoading={updateCouncilMutation.isPending}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Tên hội đồng"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên hội đồng' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Khoa / lớp phụ trách" name="facultyCode">
            <Input placeholder="Nhập mã khoa nếu có" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thêm thành viên"
        open={isMemberModalOpen}
        onCancel={() => setIsMemberModalOpen(false)}
        onOk={handleAddMember}
        confirmLoading={memberMutation.isPending}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item
            label="Chọn người dùng"
            name="userId"
            rules={[{ required: true, message: 'Vui lòng chọn thành viên' }]}
          >
            <Select
              showSearch
              placeholder="Tìm theo tên hoặc email"
              filterOption={false}
              onSearch={setMemberSearch}
              options={eligibleMembers.map((user) => ({
                value: user.id,
                label: `${user.fullName} (${user.role})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Vai trò trong hội đồng"
            name="roleInCouncil"
            rules={[{ required: true, message: 'Vui lòng nhập vai trò' }]}
          >
            <Input placeholder="Ví dụ: Chủ tịch, Thư ký" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nạp danh sách sinh viên"
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        onOk={handleImportStudents}
        confirmLoading={importStudentsMutation.isPending}
        okText="Nạp danh sách"
        cancelText="Hủy"
      >
        <Form form={importForm} layout="vertical">
          <Form.Item label="Mã khoa" name="facultyCode">
            <Input placeholder="Lọc theo khoa (tuỳ chọn)" />
          </Form.Item>
          <Form.Item label="Mã lớp" name="classCode">
            <Input placeholder="Lọc theo lớp (tuỳ chọn)" />
          </Form.Item>
          <Form.Item label="Năm học" name="namHocId">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={yearOptions.map((year) => ({
                value: year.id,
                label: year.ten || year.nienKhoa || year.ma,
              }))}
            />
          </Form.Item>
          <Form.Item label="Học kỳ" name="hocKyId">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={semesterOptions.map((semester) => ({
                value: semester.id,
                label: semester.ten,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nhập lý do không đạt"
        open={noteModalOpen}
        onCancel={() => {
          setNoteModalOpen(false);
          noteForm.resetFields();
        }}
        onOk={async () => {
          const values = await noteForm.validateFields();
          await handleBulkUpdate('FAILED', values.note);
        }}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={updateStudentsMutation.isPending}
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item label="Ghi chú" name="note" rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}>
            <Input.TextArea rows={3} placeholder="Nhập lý do không đạt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
