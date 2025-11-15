import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Button, Col, Form, Input, Row, Select, Spin, Switch } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import usersApi, { USERS_QUERY_KEY } from '@/api/users.api';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import styles from './UsersAddEditPage.module.scss';

const cx = classNames.bind(styles);

const ROLE_OPTIONS = [
  { label: 'Sinh viên', value: 'SINHVIEN' },
  { label: 'Giảng viên', value: 'GIANGVIEN' },
  { label: 'Nhân viên', value: 'NHANVIEN' },
  { label: 'Quản trị viên', value: 'ADMIN' },
];

const buildPayloadFromValues = (values) => ({
  fullName: values.fullName?.trim(),
  email: values.email?.trim(),
  role: values.role,
  password: values.password?.trim() || undefined,
  studentCode: values.studentCode?.trim() || undefined,
  staffCode: values.staffCode?.trim() || undefined,
  classCode: values.classCode?.trim() || undefined,
  departmentCode: values.departmentCode?.trim() || undefined,
  phoneNumber: values.phoneNumber?.trim() || undefined,
  isActive: values.isActive,
});

const UsersAddEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditMode = Boolean(id);
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();

  const handleBackToList = useCallback(() => {
    navigate(ROUTE_PATHS.ADMIN.USERS);
  }, [navigate]);

  const pageTitle = useMemo(() => (isEditMode ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'), [isEditMode]);

  useEffect(() => {
    const breadcrumbs = [
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Quản lý người dùng', path: ROUTE_PATHS.ADMIN.USERS },
      {
        label: pageTitle,
        path: isEditMode ? buildPath.adminUserEdit(id) : ROUTE_PATHS.ADMIN.USER_CREATE,
      },
    ];
    setBreadcrumbs(breadcrumbs);
    setPageActions([
      {
        key: 'back-to-users',
        label: 'Quay lại danh sách',
        icon: <FontAwesomeIcon icon={faArrowLeft} />,
        onClick: handleBackToList,
      },
    ]);

    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [id, isEditMode, pageTitle, setBreadcrumbs, setPageActions, handleBackToList]);

  useEffect(() => {
    if (!isEditMode) {
      form.setFieldsValue({ isActive: true, role: 'SINHVIEN' });
    }
  }, [form, isEditMode]);

  const detailQuery = useQuery({
    queryKey: [USERS_QUERY_KEY, 'detail', id],
    queryFn: () => usersApi.detail(id),
    enabled: isEditMode,
    onError: (error) => {
      openToast({
        message: error.response?.data?.error || 'Không thể tải thông tin người dùng.',
        variant: 'danger',
      });
      handleBackToList();
    },
  });

  useEffect(() => {
    if (!isEditMode) return;
    const user = detailQuery.data?.user;
    if (!user) return;

    form.setFieldsValue({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'SINHVIEN',
      studentCode: user.studentCode || '',
      staffCode: user.staffCode || '',
      classCode: user.classCode || '',
      departmentCode: user.departmentCode || '',
      phoneNumber: user.phoneNumber || '',
      isActive: Boolean(user.isActive),
      password: '',
      confirmPassword: '',
    });
  }, [detailQuery.data, form, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (payload) => usersApi.create(payload),
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Thêm người dùng thành công.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      handleBackToList();
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể tạo người dùng.', variant: 'danger' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => usersApi.update(id, payload),
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Cập nhật người dùng thành công.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      handleBackToList();
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể cập nhật người dùng.', variant: 'danger' });
    },
  });

  const handleSubmit = (values) => {
    const payload = buildPayloadFromValues(values);

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;
  const isLoadingDetail = isEditMode && (detailQuery.isLoading || detailQuery.isFetching);

  return (
    <div className={cx('users-add-edit-page')}>
      {contextHolder}
      <div className={cx('users-add-edit-page__card')}>
        <div className={cx('users-add-edit-page__header')}>
          <div className={cx('users-add-edit-page__icon')}>
            <FontAwesomeIcon icon={isEditMode ? faFloppyDisk : faUserPlus} />
          </div>
          <div>
            <h2 className={cx('users-add-edit-page__title')}>{pageTitle}</h2>
            <p className={cx('users-add-edit-page__subtitle')}>
              {isEditMode
                ? 'Cập nhật thông tin tài khoản và trạng thái hoạt động của người dùng.'
                : 'Nhập thông tin chi tiết để tạo tài khoản người dùng mới vào hệ thống.'}
            </p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className={cx('users-add-edit-page__form')}
          initialValues={{ isActive: true, role: 'SINHVIEN' }}
        >
          <Spin spinning={isLoadingDetail}>
            <Row gutter={[24, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Họ và tên"
                  name="fullName"
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên.' }]}
                >
                  <Input placeholder="Nhập họ và tên" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email.' },
                    { type: 'email', message: 'Email không hợp lệ.' },
                  ]}
                >
                  <Input placeholder="ví dụ: sinhvien@huit.edu.vn" allowClear />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}>
                  <Select options={ROLE_OPTIONS} placeholder="Chọn vai trò" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Số điện thoại" name="phoneNumber">
                  <Input placeholder="Nhập số điện thoại" allowClear />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Mã sinh viên" name="studentCode">
                  <Input placeholder="Nhập mã sinh viên" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Mã cán bộ" name="staffCode">
                  <Input placeholder="Nhập mã cán bộ" allowClear />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Mã lớp" name="classCode">
                  <Input placeholder="Nhập mã lớp" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Mã khoa" name="departmentCode">
                  <Input placeholder="Nhập mã khoa" allowClear />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[
                    ...(isEditMode ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu.' }]),
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' },
                  ]}
                >
                  <Input.Password
                    placeholder={isEditMode ? 'Để trống nếu không thay đổi' : 'Nhập mật khẩu'}
                    visibilityToggle
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    ...(isEditMode ? [] : [{ required: true, message: 'Vui lòng xác nhận mật khẩu.' }]),
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const password = getFieldValue('password');
                        if (!password && !value) {
                          return Promise.resolve();
                        }
                        if (value === password) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Nhập lại mật khẩu" visibilityToggle allowClear />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Spin>

          <div className={cx('users-add-edit-page__actions')}>
            <Button onClick={handleBackToList}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              icon={<FontAwesomeIcon icon={faFloppyDisk} />}
            >
              {isEditMode ? 'Cập nhật' : 'Tạo'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default UsersAddEditPage;
