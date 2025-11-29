import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Button, Col, Form, Input, Row, Select, Spin, Switch, Upload, Avatar } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk, faUserPlus, faCamera } from '@fortawesome/free-solid-svg-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import usersApi, { USERS_QUERY_KEY } from '@/api/users.api';
import studentsApi from '@/api/students.api';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import { fileToDataUrl } from '@/utils/file';
import styles from './UsersAddEditPage.module.scss';

const cx = classNames.bind(styles);

const ROLE_OPTIONS = [
  { label: 'Sinh viên', value: 'SINHVIEN' },
  { label: 'Giảng viên', value: 'GIANGVIEN' },
  { label: 'Nhân viên', value: 'NHANVIEN' },
  { label: 'Quản trị viên', value: 'ADMIN' },
];

const buildPayloadFromValues = (values, avatarData) => ({
  fullName: values.fullName?.trim(),
  email: values.email?.trim(),
  role: values.role,
  password: values.password?.trim() || undefined,
  studentCode: values.studentCode?.trim() || undefined,
  staffCode: values.staffCode?.trim() || undefined,
  lopHocId: values.classId ?? null,
  phoneNumber: values.phoneNumber?.trim() || undefined,
  isActive: values.isActive,
  avatarImage: avatarData,
  gender: values.gender,
});

const UsersAddEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditMode = Boolean(id);
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [avatarFileList, setAvatarFileList] = useState([]);
  const [avatarData, setAvatarData] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [selectedMajorId, setSelectedMajorId] = useState(null);

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

  const facultiesQuery = useQuery({
    queryKey: ['faculties'],
    queryFn: () => studentsApi.getFaculties(),
  });

  const majorsQuery = useQuery({
    queryKey: ['majors', selectedFacultyId],
    queryFn: () => studentsApi.getMajorsByFaculty(selectedFacultyId),
    enabled: !!selectedFacultyId,
  });

  const classesQuery = useQuery({
    queryKey: ['classes', selectedMajorId],
    queryFn: () => studentsApi.getClassesByMajor(selectedMajorId),
    enabled: !!selectedMajorId,
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
      classId: user.classId || '',
      majorId: user.majorId || '',
      facultyId: user.facultyId || '',
      phoneNumber: user.phoneNumber || '',
      isActive: Boolean(user.isActive),
      password: '',
      confirmPassword: '',
      gender: user.gender || user.gioiTinh || undefined,
    });

    if (user.facultyId) setSelectedFacultyId(user.facultyId);
    if (user.majorId) setSelectedMajorId(user.majorId);

    if (user.avatarUrl) {
      setAvatarFileList([
        {
          uid: '-1',
          name: 'avatar',
          status: 'done',
          url: user.avatarUrl,
        },
      ]);
    }
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

  const handleSubmit = async (values) => {
    let avatarPayload = avatarData;

    if (avatarFileList.length > 0 && avatarFileList[0].originFileObj) {
      try {
        const file = avatarFileList[0].originFileObj;
        const dataUrl = await fileToDataUrl(file);
        avatarPayload = {
          dataUrl,
          fileName: file.name,
        };
      } catch {
        openToast({ message: 'Không thể xử lý ảnh avatar', variant: 'danger' });
        return;
      }
    }

    const payload = buildPayloadFromValues(values, avatarPayload);

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
                <Form.Item
                  label="Giới tính"
                  name="gender"
                  rules={[{ required: true, message: 'Vui lòng chọn giới tính.' }]}
                >
                  <Select placeholder="Chọn giới tính">
                    <Select.Option value="Nam">Nam</Select.Option>
                    <Select.Option value="Nữ">Nữ</Select.Option>
                    <Select.Option value="Khác">Khác</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* Avatar Upload */}
              <Col xs={24}>
                <Form.Item label="Avatar người dùng">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Avatar
                      size={80}
                      src={avatarFileList[0]?.url || avatarFileList[0]?.thumbUrl}
                      icon={<FontAwesomeIcon icon={faCamera} />}
                      style={{ backgroundColor: '#f0f0f0' }}
                    />
                    <Upload
                      listType="picture"
                      fileList={avatarFileList}
                      beforeUpload={(file) => {
                        const isImage = file.type.startsWith('image/');
                        if (!isImage) {
                          openToast({ message: 'Chỉ chấp nhận file ảnh!', variant: 'danger' });
                          return Upload.LIST_IGNORE;
                        }
                        const isLt5M = file.size / 1024 / 1024 < 5;
                        if (!isLt5M) {
                          openToast({ message: 'Ảnh phải nhỏ hơn 5MB!', variant: 'danger' });
                          return Upload.LIST_IGNORE;
                        }
                        return false;
                      }}
                      onChange={({ fileList: newFileList }) => {
                        setAvatarFileList(newFileList.slice(-1));
                      }}
                      onRemove={() => {
                        setAvatarFileList([]);
                        setAvatarData(null);
                      }}
                      maxCount={1}
                      accept="image/*"
                    >
                      <Button icon={<FontAwesomeIcon icon={faCamera} />}>
                        {avatarFileList.length > 0 ? 'Thay đổi avatar' : 'Upload avatar'}
                      </Button>
                    </Upload>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                    Hỗ trợ: JPG, PNG, WEBP. Kích thước tối đa: 5MB
                  </div>
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

              <Col xs={24} md={8}>
                <Form.Item label="Khoa" name="facultyId">
                  <Select
                    placeholder="Chọn khoa"
                    options={facultiesQuery.data?.map((f) => ({
                      label: f.tenKhoa,
                      value: f.id,
                    }))}
                    onChange={(value) => {
                      setSelectedFacultyId(value);
                      setSelectedMajorId(null);
                      form.setFieldsValue({ majorId: null, classId: null });
                    }}
                    loading={facultiesQuery.isLoading}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Ngành" name="majorId">
                  <Select
                    placeholder="Chọn ngành"
                    options={majorsQuery.data?.map((m) => ({
                      label: m.tenNganh,
                      value: m.id,
                    }))}
                    onChange={(value) => {
                      setSelectedMajorId(value);
                      form.setFieldsValue({ classId: null });
                    }}
                    loading={majorsQuery.isLoading}
                    disabled={!selectedFacultyId}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Lớp" name="classId">
                  <Select
                    placeholder="Chọn lớp"
                    options={classesQuery.data?.map((c) => ({
                      label: c.tenLop,
                      value: c.id,
                    }))}
                    loading={classesQuery.isLoading}
                    disabled={!selectedMajorId}
                    allowClear
                  />
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
