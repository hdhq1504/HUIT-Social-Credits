import { useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, DatePicker, Empty, Form, Modal, Spin, Switch, Tag, Input } from 'antd';
import dayjs from 'dayjs';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import academicsApi, { ACADEMICS_QUERY_KEY } from '@/api/academics.api';
import AdminSearchBar from '@/admin/layouts/AdminSearchBar/AdminSearchBar';
import useToast from '@/components/Toast/Toast';
import styles from './AcademicSettingsPage.module.scss';

const { RangePicker } = DatePicker;

const STATUS_META = {
  active: { color: 'success', label: 'Đang áp dụng' },
  inactive: { color: 'default', label: 'Tạm dừng' },
};

const formatRange = (start, end) => {
  if (!start || !end) return 'Chưa cập nhật';
  return `${dayjs(start).format('DD/MM/YYYY')} - ${dayjs(end).format('DD/MM/YYYY')}`;
};

const normalizeQuery = (value) => String(value || '').trim().toLowerCase();

export default function AcademicSettingsPage() {
  const [filters, setFilters] = useState({ query: '', status: 'all' });
  const [modalState, setModalState] = useState({ type: null, target: null });
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { contextHolder, open: openToast } = useToast();
  const { setBreadcrumbs } = useContext(AdminPageContext);

  const { data, isLoading } = useQuery({
    queryKey: ACADEMICS_QUERY_KEY,
    queryFn: academicsApi.listSemesters,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Cấu hình học kỳ', path: ROUTE_PATHS.ADMIN.ACADEMIC_SETTINGS },
    ]);
    return () => setBreadcrumbs(null);
  }, [setBreadcrumbs]);

  const years = useMemo(() => data?.academicYears ?? [], [data?.academicYears]);

  const filteredYears = useMemo(() => {
    const query = normalizeQuery(filters.query);
    return years.filter((year) => {
      const matchesStatus =
        filters.status === 'all' || (filters.status === 'active' ? year.isActive : !year.isActive);
      if (!matchesStatus) return false;
      if (!query) return true;
      const tokens = [year.label, year.code, year.startDate, year.endDate];
      year.semesters?.forEach((semester) => {
        tokens.push(semester.label, semester.code);
      });
      return tokens.some((token) => normalizeQuery(token).includes(query));
    });
  }, [years, filters]);

  const { mutateAsync: updateYear } = useMutation({
    mutationFn: ({ id, payload }) => academicsApi.updateAcademicYear(id, payload),
    onSuccess: async () => {
      openToast({ message: 'Đã cập nhật năm học.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ACADEMICS_QUERY_KEY });
      closeModal();
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể cập nhật năm học.', variant: 'danger' });
    },
  });

  const { mutateAsync: updateSemester } = useMutation({
    mutationFn: ({ id, payload }) => academicsApi.updateSemester(id, payload),
    onSuccess: async () => {
      openToast({ message: 'Đã cập nhật học kỳ.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ACADEMICS_QUERY_KEY });
      closeModal();
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể cập nhật học kỳ.', variant: 'danger' });
    },
  });

  const isModalSubmitting = updateYear.isPending || updateSemester.isPending;

  const handleToolbarSubmit = (payload) => {
    setFilters({
      query: payload.query || '',
      status: payload.status || 'all',
    });
  };

  const handleResetFilters = () => {
    setFilters({ query: '', status: 'all' });
  };

  const openYearModal = (year) => {
    form.setFieldsValue({
      label: year.label || year.code,
      dateRange:
        year.startDate && year.endDate ? [dayjs(year.startDate), dayjs(year.endDate)] : undefined,
      isActive: year.isActive,
    });
    setModalState({ type: 'year', target: year });
  };

  const openSemesterModal = (semester) => {
    form.setFieldsValue({
      label: semester.label || semester.code,
      description: semester.description || '',
      dateRange:
        semester.startDate && semester.endDate
          ? [dayjs(semester.startDate), dayjs(semester.endDate)]
          : undefined,
      isActive: semester.isActive,
    });
    setModalState({ type: 'semester', target: semester });
  };

  const closeModal = () => {
    setModalState({ type: null, target: null });
    form.resetFields();
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {};
      if (values.label) payload.label = values.label.trim();
      if (values.description !== undefined) payload.description = values.description.trim();
      if (Array.isArray(values.dateRange) && values.dateRange.length === 2) {
        payload.startDate = values.dateRange[0].startOf('day').toISOString();
        payload.endDate = values.dateRange[1].endOf('day').toISOString();
      }
      if (typeof values.isActive === 'boolean') payload.isActive = values.isActive;
      if (!modalState.target?.id) {
        openToast({ message: 'Không tìm thấy bản ghi cần cập nhật.', variant: 'danger' });
        return;
      }
      if (modalState.type === 'year') {
        await updateYear({ id: modalState.target.id, payload });
      } else if (modalState.type === 'semester') {
        await updateSemester({ id: modalState.target.id, payload });
      }
    } catch (error) {
      if (!error?.errorFields) {
        openToast({ message: 'Vui lòng kiểm tra thông tin vừa nhập.', variant: 'danger' });
      }
    }
  };

  return (
    <div className={styles['academic-settings']}>
      {contextHolder}
      <AdminSearchBar
        searchPlaceholder="Tìm kiếm năm học hoặc học kỳ"
        defaultValues={{ query: filters.query, status: filters.status }}
        filters={[
          {
            key: 'status',
            type: 'select',
            placeholder: 'Trạng thái',
            options: [
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Đang áp dụng' },
              { value: 'inactive', label: 'Ngưng áp dụng' },
            ],
            allowClear: false,
          },
        ]}
        actions={[{ key: 'reset', label: 'Đặt lại', onClick: handleResetFilters }]}
        onSubmit={handleToolbarSubmit}
      />

      {isLoading ? (
        <div className={styles['academic-settings__loading']}>
          <Spin />
        </div>
      ) : filteredYears.length ? (
        <div className={styles['academic-settings__grid']}>
          {filteredYears.map((year) => (
            <Card key={year.id} className={styles['academic-settings__card']}>
              <div className={styles['academic-settings__card-header']}>
                <div>
                  <p className={styles['academic-settings__card-subtitle']}>Năm học</p>
                  <h3>{year.label || year.code}</h3>
                  <span className={styles['academic-settings__card-range']}>
                    {formatRange(year.startDate, year.endDate)}
                  </span>
                </div>
                <Tag className={styles['academic-settings__status-tag']}>
                  {year.isActive ? STATUS_META.active.label : STATUS_META.inactive.label}
                </Tag>
              </div>
              <div className={styles['academic-settings__card-actions']}>
                <Button size="small" onClick={() => openYearModal(year)}>
                  Chỉnh sửa thời gian
                </Button>
              </div>
              <div className={styles['academic-settings__semester-list']}>
                {year.semesters?.length ? (
                  year.semesters.map((semester) => (
                    <div key={semester.id} className={styles['academic-settings__semester-item']}>
                      <div>
                        <strong>{semester.label || semester.code}</strong>
                        <p>{formatRange(semester.startDate, semester.endDate)}</p>
                      </div>
                      <div className={styles['academic-settings__semester-actions']}>
                        <Tag className={styles['academic-settings__status-tag']}>
                          {semester.isActive ? STATUS_META.active.label : STATUS_META.inactive.label}
                        </Tag>
                        <Button size="small" type="link" onClick={() => openSemesterModal(semester)}>
                          Điều chỉnh
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles['academic-settings__empty-semester']}>Chưa có học kỳ.</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty description="Không tìm thấy dữ liệu phù hợp" className={styles['academic-settings__empty']} />
      )}

      <Modal
        title={modalState.type === 'year' ? 'Cập nhật năm học' : 'Cập nhật học kỳ'}
        open={Boolean(modalState.type)}
        onCancel={closeModal}
        onOk={handleModalSubmit}
        confirmLoading={isModalSubmitting}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Tên hiển thị" name="label" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Ví dụ: Năm học 2024-2025" />
          </Form.Item>
          {modalState.type === 'semester' && (
            <Form.Item label="Mô tả" name="description">
              <Input.TextArea rows={3} placeholder="Ghi chú cho học kỳ" />
            </Form.Item>
          )}
          <Form.Item
            label="Thời gian diễn ra"
            name="dateRange"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
