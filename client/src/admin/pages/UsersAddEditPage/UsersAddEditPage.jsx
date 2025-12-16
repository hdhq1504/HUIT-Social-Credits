import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Button, Col, Form, Input, Row, Select, Spin, Switch, Upload, Avatar, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk, faCamera, faCircleDot } from '@fortawesome/free-solid-svg-icons';
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
  const role = Form.useWatch('role', form);
  const isActive = Form.useWatch('isActive', form);
  const isEditMode = Boolean(id);
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [avatarFileList, setAvatarFileList] = useState([]);
  const [avatarData] = useState(null);
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
        type: 'primary',
        key: 'back-to-users',
        label: 'Quay lại',
        className: 'admin-navbar__btn--primary',
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
      <div className={cx('users-add-edit-page__container')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className={cx('users-add-edit-page__form')}
          initialValues={{ isActive: true, role: 'SINHVIEN' }}
        >
          <Spin spinning={isLoadingDetail}>
            <Row gutter={24}>
              <Col xs={24} lg={8}>
                <div className={cx('users-add-edit-page__sidebar-card')}>
                  <div className={cx('users-add-edit-page__avatar-section')}>
                    <Upload
                      listType="picture-card"
                      showUploadList={false}
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
                      maxCount={1}
                      accept="image/*"
                    >
                      <div className={cx('users-add-edit-page__avatar-wrapper')}>
                        <Avatar
                          size={120}
                          src={
                            avatarFileList[0]?.url ||
                            avatarFileList[0]?.thumbUrl ||
                            (avatarFileList[0]?.originFileObj
                              ? URL.createObjectURL(avatarFileList[0].originFileObj)
                              : null)
                          }
                          icon={<FontAwesomeIcon icon={faCamera} />}
                          style={{ backgroundColor: '#f1f5f9', color: '#cbd5e1', fontSize: '40px' }}
                        />
                        <div className={cx('users-add-edit-page__avatar-overlay')}>
                          <FontAwesomeIcon icon={faCamera} />
                        </div>
                      </div>
                    </Upload>
                    <div className={cx('users-add-edit-page__upload-hint')}>Nhấn để thay đổi ảnh đại diện</div>
                    <Tag
                      className={cx(
                        'users-add-edit-page__status-tag',
                        isActive
                          ? 'users-add-edit-page__status-tag--active'
                          : 'users-add-edit-page__status-tag--inactive',
                      )}
                    >
                      <FontAwesomeIcon icon={faCircleDot} className={cx('users-add-edit-page__status-icon')} />
                      {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                    </Tag>
                  </div>

                  <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>

                  <Form.Item
                    label="Vai trò hệ thống"
                    name="role"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}
                  >
                    <Select options={ROLE_OPTIONS} placeholder="Chọn vai trò" />
                  </Form.Item>
                </div>
              </Col>

              {/* Main Content */}
              <Col xs={24} lg={16}>
                <div className={cx('users-add-edit-page__main-card')}>
                  {/* Section 1: Personal Info */}
                  <div className={cx('users-add-edit-page__section-title')}>Thông tin chung</div>
                  <Row gutter={24}>
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
                        label="Số điện thoại"
                        name="phoneNumber"
                        rules={[
                          ...(isEditMode ? [] : [{ required: true, message: 'Vui lòng nhập số điện thoại.' }]),
                          { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Số điện thoại không hợp lệ.' },
                        ]}
                      >
                        <Input placeholder="Nhập số điện thoại" allowClear />
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
                  </Row>

                  <div className={cx('users-add-edit-page__divider')} />

                  <div className={cx('users-add-edit-page__section-title')}>Thông tin học vấn / Công tác</div>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Mã sinh viên"
                        name="studentCode"
                        rules={[
                          ...(role === 'SINHVIEN' && !isEditMode
                            ? [{ required: true, message: 'Vui lòng nhập mã sinh viên.' }]
                            : []),
                          {
                            pattern: /^[a-zA-Z0-9]{10}$/,
                            message: 'Mã sinh viên phải có đúng 10 ký tự chữ và số.',
                          },
                        ]}
                      >
                        <Input placeholder="Nhập mã sinh viên" allowClear disabled={role !== 'SINHVIEN'} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Mã cán bộ"
                        name="staffCode"
                        rules={[
                          ...(role !== 'SINHVIEN' && !isEditMode
                            ? [{ required: true, message: 'Vui lòng nhập mã cán bộ.' }]
                            : []),
                        ]}
                      >
                        <Input placeholder="Nhập mã cán bộ" allowClear disabled={role === 'SINHVIEN'} />
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
                          disabled={!selectedFacultyId || role !== 'SINHVIEN'}
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
                          disabled={!selectedMajorId || role !== 'SINHVIEN'}
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className={cx('users-add-edit-page__divider')} />

                  <div className={cx('users-add-edit-page__section-title')}>Bảo mật</div>
                  <Row gutter={24}>
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
                  </Row>

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
                </div>
              </Col>
            </Row>
          </Spin>
        </Form>
      </div>
    </div>
  );
};

export default UsersAddEditPage;
