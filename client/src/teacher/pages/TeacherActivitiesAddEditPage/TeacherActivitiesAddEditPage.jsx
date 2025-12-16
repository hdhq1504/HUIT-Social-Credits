import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Form, Input, Select, InputNumber, DatePicker, TimePicker, Upload, Row, Col, ConfigProvider, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleInfo,
  faXmark,
  faUserPlus,
  faFileLines,
  faImage,
  faFloppyDisk,
  faPaperclip,
  faUser,
  faCalendar,
  faPenToSquare,
  faCircleCheck,
  faWarning,
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viVN from 'antd/locale/vi_VN';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RichTextEditor } from '@/components';
import { TeacherPageContext } from '@/teacher/contexts/TeacherPageContext';
import useToast from '@/components/Toast/Toast';
import activitiesApi, { ACTIVITIES_QUERY_KEY, DASHBOARD_QUERY_KEY } from '@/api/activities.api';
import { ADMIN_DASHBOARD_QUERY_KEY } from '@/api/stats.api';
import { ROUTE_PATHS } from '@/config/routes.config';
import { deriveSemesterInfo } from '@/utils/semester';
import { fileToDataUrl } from '@/utils/file';
import useAuthStore from '@/stores/useAuthStore';
import styles from './TeacherActivitiesAddEditPage.module.scss';

dayjs.locale('vi');
const cx = classNames.bind(styles);
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const now = dayjs();
const today = dayjs().format('DD/MM/YYYY');
const todayTime = now.format('HH:mm');

const combineDateAndTime = (date, time) => {
  if (!date || !time) return null;
  return date.hour(time.hour()).minute(time.minute()).second(0).toISOString();
};

// Helper chuyển mảng về chuỗi (cho TextAreas)
const arrayToString = (value) => {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value || '';
};

// Helper chuyển chuỗi về mảng (từ TextAreas)
const stringToArray = (value) => {
  if (!value) return [];
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.trim() !== '');
};

const ActivitiesAddEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [coverFileList, setCoverFileList] = useState([]);
  const [initialCoverMeta, setInitialCoverMeta] = useState(null);
  const startDateValue = Form.useWatch('startDate', form);
  const registrationDeadlineValue = Form.useWatch('registrationDeadline', form);
  const isEditMode = !!id;

  const { setPageActions, setBreadcrumbs } = useContext(TeacherPageContext);
  const { contextHolder, open: openToast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY, 'detail', id],
    queryFn: () => activitiesApi.detail(id),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isEditMode && activityData) {
      const coverMeta = activityData.coverImageMeta ?? null;
      const coverFiles = coverMeta?.url
        ? [
            {
              uid: coverMeta.path || coverMeta.url,
              name: coverMeta.fileName || 'cover-image',
              status: 'done',
              url: coverMeta.url,
              thumbUrl: coverMeta.url,
              meta: coverMeta,
            },
          ]
        : [];
      setCoverFileList(coverFiles);
      setInitialCoverMeta(coverMeta);
      form.setFieldsValue({
        title: activityData.title,
        pointGroup: activityData.pointGroup,
        points: activityData.points,
        location: activityData.location,
        maxCapacity: activityData.maxCapacity,
        semester: activityData.semester || '',
        academicYear: activityData.academicYear || '',
        attendanceMethod: activityData.attendanceMethod || 'qr',
        registrationDeadline: activityData.registrationDeadline ? dayjs(activityData.registrationDeadline) : null,
        cancellationDeadline: activityData.cancellationDeadline ? dayjs(activityData.cancellationDeadline) : null,

        // Map ngày/giờ
        startDate: activityData.startTime ? dayjs(activityData.startTime) : null,
        startTime: activityData.startTime ? dayjs(activityData.startTime) : null,
        endDate: activityData.endTime ? dayjs(activityData.endTime) : null,
        endTime: activityData.endTime ? dayjs(activityData.endTime) : null,

        // Map các trường JSON (chuyển mảng về string)
        description: activityData.description,
        requirements: arrayToString(activityData.requirements),
        guidelines: arrayToString(activityData.guidelines),
        coverImage: coverFiles,
      });
    } else if (!isEditMode) {
      setCoverFileList([]);
      setInitialCoverMeta(null);
      form.setFieldsValue({ coverImage: [] });
    }
  }, [activityData, isEditMode, form]);

  const handleBackToList = useCallback(() => {
    navigate(ROUTE_PATHS.TEACHER.ACTIVITIES);
  }, [navigate]);

  const createActivityMutation = useMutation({
    mutationFn: (activityData) => activitiesApi.create(activityData),
    onSuccess: () => {
      openToast({ message: 'Thêm hoạt động mới thành công!', variant: 'success' });
      queryClient.invalidateQueries(DASHBOARD_QUERY_KEY);
      queryClient.invalidateQueries(ADMIN_DASHBOARD_QUERY_KEY);
      queryClient.invalidateQueries(ACTIVITIES_QUERY_KEY);
      navigate(ROUTE_PATHS.TEACHER.ACTIVITIES);
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Tạo hoạt động thất bại', variant: 'danger' });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: (payload) => activitiesApi.update(payload.id, payload.data),
    onSuccess: () => {
      openToast({ message: 'Cập nhật hoạt động thành công!', variant: 'success' });
      queryClient.invalidateQueries([ACTIVITIES_QUERY_KEY, 'detail', id]);
      queryClient.invalidateQueries(ACTIVITIES_QUERY_KEY);
      queryClient.invalidateQueries(DASHBOARD_QUERY_KEY);
      queryClient.invalidateQueries(ADMIN_DASHBOARD_QUERY_KEY);
      navigate(ROUTE_PATHS.TEACHER.ACTIVITIES);
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Cập nhật thất bại', variant: 'danger' });
    },
  });

  const onFinish = async (values) => {
    let coverImagePayload;
    if (coverFileList.length === 0) {
      if (isEditMode && initialCoverMeta) {
        coverImagePayload = null;
      }
    } else {
      const [fileItem] = coverFileList;

      if (fileItem?.originFileObj) {
        try {
          const dataUrl = await fileToDataUrl(fileItem.originFileObj);
          coverImagePayload = {
            dataUrl: dataUrl,
            fileName: fileItem.originFileObj.name,
            mimeType: fileItem.originFileObj.type,
          };
        } catch (error) {
          console.error('Failed to read file as dataUrl', error);
          openToast({ message: error?.message || 'Không thể đọc file ảnh. Vui lòng thử lại.', variant: 'danger' });
          return;
        }
      } else if (fileItem?.meta) {
        coverImagePayload = fileItem.meta;
      } else if (fileItem?.url) {
        coverImagePayload = {
          url: fileItem.url,
          fileName: fileItem.name,
        };
      }
    }

    const payload = {
      tieuDe: values.title,
      nhomDiem: values.pointGroup,
      diemCong: values.points,
      diaDiem: values.location,
      sucChuaToiDa: values.maxCapacity,
      moTa: values.description,
      yeuCau: stringToArray(values.requirements),
      huongDan: stringToArray(values.guidelines),
      batDauLuc: combineDateAndTime(values.startDate, values.startTime),
      ketThucLuc: combineDateAndTime(values.endDate, values.endTime),
      attendanceMethod: values.attendanceMethod,
      registrationDeadline: values.registrationDeadline ? values.registrationDeadline.toISOString() : null,
      cancellationDeadline: values.cancellationDeadline ? values.cancellationDeadline.toISOString() : null,
    };

    if (coverImagePayload !== undefined) {
      payload.coverImage = coverImagePayload;
    }

    if (isEditMode) {
      updateActivityMutation.mutate({ id, data: payload });
    } else {
      createActivityMutation.mutate(payload);
    }
  };

  useEffect(() => {
    const isMutating = createActivityMutation.isLoading || updateActivityMutation.isLoading;
    const newTitle = isEditMode ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới';

    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.TEACHER.DASHBOARD },
      { label: 'Hoạt động', path: ROUTE_PATHS.TEACHER.ACTIVITIES },
      { label: newTitle },
    ]);

    setPageActions([
      {
        key: 'cancel',
        label: 'Hủy',
        icon: <FontAwesomeIcon icon={faXmark} />,
        type: 'primary',
        className: 'admin-navbar__btn--primary',
        onClick: handleBackToList,
        disabled: isMutating,
      },
      {
        key: 'save',
        label: 'Lưu',
        icon: isMutating ? <Spin /> : <FontAwesomeIcon icon={faFloppyDisk} />,
        type: 'primary',
        className: 'admin-navbar__btn--primary',
        onClick: () => form.submit(),
        loading: isMutating,
      },
    ]);

    return () => {
      setPageActions(null);
      setBreadcrumbs(null);
    };
  }, [
    setPageActions,
    setBreadcrumbs,
    navigate,
    form,
    isEditMode,
    createActivityMutation.isLoading,
    updateActivityMutation.isLoading,
    handleBackToList,
  ]);

  const normFile = (e) => {
    const fileList = Array.isArray(e) ? e : e?.fileList || [];
    const limited = fileList.slice(-1);
    setCoverFileList(limited);
    return limited;
  };

  useEffect(() => {
    // Auto-fill cancellation deadline = registration deadline
    // This ensures cancellationDeadline ≤ registrationDeadline
    if (!registrationDeadlineValue) {
      form.setFieldsValue({ cancellationDeadline: null });
      return;
    }

    const currentValue = form.getFieldValue('cancellationDeadline');
    // Only auto-fill if not already set
    if (!currentValue) {
      form.setFieldsValue({ cancellationDeadline: registrationDeadlineValue });
      setTimeout(() => {
        form.validateFields(['cancellationDeadline']);
      }, 0);
    }
  }, [form, registrationDeadlineValue]);

  useEffect(() => {
    if (!startDateValue) {
      form.setFieldsValue({ semester: '', academicYear: '' });
      return;
    }

    const { semester, academicYear } = deriveSemesterInfo(startDateValue);
    const updates = {};
    if (semester && form.getFieldValue('semester') !== semester) {
      updates.semester = semester;
    }
    if (academicYear && form.getFieldValue('academicYear') !== academicYear) {
      updates.academicYear = academicYear;
    }
    if (Object.keys(updates).length > 0) {
      form.setFieldsValue(updates);
    }
  }, [form, startDateValue]);

  if (isLoadingActivity) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider locale={viVN}>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className={cx('activities')}
        initialValues={{
          points: 0,
          maxCapacity: 0,
          semester: '',
          academicYear: '',
          attendanceMethod: 'photo',
        }}
      >
        <div className={cx('activities__container')}>
          <div className={cx('activities__left')}>
            <section className={cx('activities__section')}>
              <div className={cx('activities__section-header')}>
                <FontAwesomeIcon className={cx('activities__section-icon')} icon={faCircleInfo} />
                <h3>Thông tin cơ bản</h3>
              </div>
              <Row gutter={24}>
                <Col xs={24} md={24}>
                  <Form.Item
                    name="title"
                    label="Tên hoạt động"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập tên hoạt động!' }]}
                  >
                    <Input placeholder="Nhập tên hoạt động..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="pointGroup"
                    label="Nhóm hoạt động"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng chọn nhóm hoạt động!' }]}
                  >
                    <Select placeholder="Chọn nhóm hoạt động">
                      <Option value="NHOM_1">Nhóm 1</Option>
                      <Option value="NHOM_2">Nhóm 2</Option>
                      <Option value="NHOM_3">Nhóm 3</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="points"
                    label="Số điểm"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập số điểm!' }]}
                  >
                    <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="startDate"
                    label="Ngày bắt đầu"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
                  >
                    <DatePicker placeholder="dd/mm/yyyy" format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="endDate"
                    label="Ngày kết thúc"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
                  >
                    <DatePicker placeholder="dd/mm/yyyy" format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="startTime"
                    label="Giờ bắt đầu"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
                  >
                    <TimePicker placeholder="--:--" format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="endTime"
                    label="Giờ kết thúc"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc!' }]}
                  >
                    <TimePicker placeholder="--:--" format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={24}>
                  <Form.Item
                    name="location"
                    label="Địa điểm"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập địa điểm!' }]}
                  >
                    <Input placeholder="Nhập địa điểm tổ chức..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="semester"
                    label="Học kỳ"
                    className={cx('activities__group')}
                    tooltip="Tự động tính dựa trên ngày bắt đầu"
                  >
                    <Input placeholder="Tự động" disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="academicYear"
                    label="Năm học"
                    className={cx('activities__group')}
                    tooltip="Tự động tính dựa trên ngày bắt đầu"
                  >
                    <Input placeholder="Tự động" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className={cx('activities__section')}>
              <div className={cx('activities__section-header')}>
                <FontAwesomeIcon className={cx('activities__section-icon')} icon={faUserPlus} />
                <h3>Cài đặt đăng ký</h3>
              </div>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="maxCapacity"
                    label="Số lượng tham gia"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                  >
                    <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} style={{ display: 'none' }}>
                  <Form.Item
                    name="attendanceMethod"
                    label="Phương thức điểm danh"
                    className={cx('activities__group')}
                    initialValue="photo"
                  >
                    <Input type="hidden" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="registrationDeadline"
                    label="Hạn đăng ký"
                    className={cx('activities__group')}
                    dependencies={['startDate', 'startTime']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      { required: true, message: 'Vui lòng chọn hạn đăng ký!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const startDate = getFieldValue('startDate');
                          const startTime = getFieldValue('startTime');
                          if (!value || !startDate || !startTime) {
                            return Promise.resolve();
                          }
                          const startDateTime = startDate.hour(startTime.hour()).minute(startTime.minute()).second(0);
                          const minDeadline = startDateTime.subtract(7, 'day');
                          if (value.isAfter(minDeadline)) {
                            return Promise.reject(
                              new Error('Hạn đăng ký phải trước thời gian bắt đầu ít nhất 7 ngày!'),
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <DatePicker
                      showTime
                      placeholder="dd/mm/yyyy --:--"
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%' }}
                      onChange={() => {
                        setTimeout(() => {
                          form.validateFields(['registrationDeadline']);
                        }, 0);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="cancellationDeadline"
                    label="Hạn hủy đăng ký"
                    className={cx('activities__group')}
                    dependencies={['registrationDeadline']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      { required: true, message: 'Vui lòng chọn hạn hủy đăng ký!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const registrationDeadline = getFieldValue('registrationDeadline');
                          if (!value || !registrationDeadline) {
                            return Promise.resolve();
                          }
                          if (value.isAfter(registrationDeadline)) {
                            return Promise.reject(new Error('Hạn hủy đăng ký phải trước hoặc bằng hạn đăng ký!'));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <DatePicker
                      showTime
                      placeholder="dd/mm/yyyy --:--"
                      format="DD/MM/YYYY HH:mm"
                      style={{ width: '100%' }}
                      onChange={() => {
                        setTimeout(() => {
                          form.validateFields(['cancellationDeadline']);
                        }, 0);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className={cx('activities__section')}>
              <div className={cx('activities__section-header')}>
                <FontAwesomeIcon className={cx('activities__section-icon')} icon={faFileLines} />
                <h3>Thông tin chi tiết</h3>
              </div>
              <Row gutter={24}>
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả hoạt động"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    valuePropName="value"
                    getValueFromEvent={(content) => content}
                  >
                    <RichTextEditor placeholder="Mô tả chi tiết về hoạt động..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="requirements"
                    label="Yêu cầu tham gia"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập yêu cầu!' }]}
                    tooltip="Mỗi yêu cầu 1 dòng"
                  >
                    <TextArea rows={4} placeholder="Các yêu cầu đối với sinh viên tham gia..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="guidelines"
                    label="Hướng dẫn tham gia"
                    className={cx('activities__group')}
                    rules={[{ required: true, message: 'Vui lòng nhập hướng dẫn!' }]}
                    tooltip="Mỗi hướng dẫn 1 dòng"
                  >
                    <TextArea rows={4} placeholder="Hướng dẫn chi tiết cho sinh viên..." />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className={cx('activities__section')}>
              <div className={cx('activities__section-header')}>
                <FontAwesomeIcon className={cx('activities__section-icon')} icon={faImage} />
                <h3>Hình ảnh đại diện</h3>
              </div>
              <Form.Item
                name="coverImage"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                className={cx('activities__group')}
              >
                <Dragger
                  name="file"
                  multiple={false}
                  beforeUpload={() => false}
                  fileList={coverFileList}
                  maxCount={1}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onRemove={() => {
                    setCoverFileList([]);
                    form.setFieldsValue({ coverImage: [] });
                  }}
                  className={cx('activities__upload')}
                >
                  <p className="ant-upload-drag-icon">
                    <FontAwesomeIcon icon={faPaperclip} />
                  </p>
                  <p className="ant-upload-text">Kéo thả file hoặc chọn file</p>
                  <p className="ant-upload-hint">Hỗ trợ JPG, PNG, WEBP ≤ 5MB</p>
                </Dragger>
              </Form.Item>
            </section>
          </div>

          <aside className={cx('activities__right')}>
            <div className={cx('activities__status')}>
              <div className={cx('activities__status-header')}>
                <FontAwesomeIcon icon={faCircleInfo} />
                <h3>Thông tin trạng thái</h3>
              </div>

              <div className={cx('activities__status-items-wrapper')}>
                <div className={cx('activities__status-item')}>
                  <div className={cx('activities__status-icon', 'activities__status-icon--blue')}>
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div className={cx('activities__status-text')}>
                    <span>Người tạo</span>
                    <p>{user?.hoTen || user?.email || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className={cx('activities__status-item')}>
                  <div className={cx('activities__status-icon', 'activities__status-icon--green')}>
                    <FontAwesomeIcon icon={faCalendar} />
                  </div>
                  <div className={cx('activities__status-text')}>
                    <span>Ngày tạo</span>
                    <p>Hôm nay, {todayTime}</p>
                  </div>
                </div>

                <div className={cx('activities__status-item')}>
                  <div className={cx('activities__status-icon', 'activities__status-icon--orange')}>
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </div>
                  <div className={cx('activities__status-text')}>
                    <span>Cập nhật lần cuối</span>
                    <p className={cx('activities__status-text--muted')}>
                      {isEditMode ? `${today}, ${todayTime}` : 'Chưa có'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cx('activities__tips-section')}>
                <h4 className={cx('activities__tips-title')}>Gợi ý</h4>
                <div className={cx('activities__tips-wrapper')}>
                  <div className={cx('activities__tip', 'activities__tip--green')}>
                    <FontAwesomeIcon icon={faCircleCheck} className={cx('activities__tip-icon')} />
                    <p>Hình ảnh đại diện sẽ giúp thu hút sinh viên tham gia hơn.</p>
                  </div>
                  <div className={cx('activities__tip', 'activities__tip--yellow')}>
                    <FontAwesomeIcon icon={faWarning} className={cx('activities__tip-icon')} />
                    <p>Kiểm tra kỹ thời gian và địa điểm trước khi lưu.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Form>
    </ConfigProvider>
  );
};

export default ActivitiesAddEditPage;
