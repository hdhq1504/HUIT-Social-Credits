import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  Avatar,
  Button,
  Card,
  Col,
  ConfigProvider,
  Divider,
  Input,
  List,
  Modal,
  Result,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faCalendarDays,
  faCheck,
  faCircleCheck,
  faCircleDot,
  faCircleXmark,
  faDownload,
  faFileLines,
  faHourglassHalf,
  faLocationDot,
  faStar,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import viVN from 'antd/locale/vi_VN';
import feedbackApi, { FEEDBACK_DETAIL_QUERY_KEY, FEEDBACK_LIST_QUERY_KEY } from '@/api/feedback.api';
import { ADMIN_DASHBOARD_QUERY_KEY } from '@/api/stats.api';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import { formatDateTime, formatDateTimeRange } from '@/utils/datetime';
import styles from './FeedbackDetailPage.module.scss';

const cx = classNames.bind(styles);
const { Paragraph, Text } = Typography;

const STATUS_META = {
  CHO_DUYET: { label: 'Chờ duyệt', className: '--pending' },
  DA_DUYET: { label: 'Đã duyệt', className: '--approved' },
  BI_TU_CHOI: { label: 'Từ chối', className: '--rejected' },
};

const buildStatusTag = (status, label = '') => {
  const meta = STATUS_META[status] || STATUS_META.CHO_DUYET;
  return (
    <Tag className={cx('status-tag', meta.className)}>
      <FontAwesomeIcon icon={faCircleDot} className={cx('status-tag__dot')} />
      {label || meta.label}
    </Tag>
  );
};

const formatNumber = (value, placeholder = '--') => {
  if (value === undefined || value === null) return placeholder;
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('vi-VN') : value;
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const digits = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[index]}`;
};

const InfoItem = ({ icon, label, children }) => (
  <div className={cx('info-item')}>
    <span className={cx('info-item__icon')}>
      <FontAwesomeIcon icon={icon} />
    </span>
    <div className={cx('info-item__content')}>
      <span className={cx('info-item__label')}>{label}</span>
      <span className={cx('info-item__value')}>{children}</span>
    </div>
  </div>
);

function FeedbackDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...FEEDBACK_DETAIL_QUERY_KEY, id],
    queryFn: () => feedbackApi.detail(id),
    enabled: Boolean(id),
  });

  const feedback = data?.feedback;
  const stats = data?.stats ?? {};

  const decideMutation = useMutation({
    mutationFn: feedbackApi.decide,
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Cập nhật phản hồi thành công.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: FEEDBACK_LIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...FEEDBACK_DETAIL_QUERY_KEY, id] });
    },
    onError: (mutationError) => {
      openToast({
        message: mutationError.response?.data?.error || 'Không thể cập nhật trạng thái phản hồi.',
        variant: 'danger',
      });
    },
    onSettled: () => {
      setRejectModalOpen(false);
      setRejectReason('');
    },
  });

  const handleApprove = useCallback(() => {
    if (!feedback?.id) return;
    decideMutation.mutateAsync({ ids: [feedback.id], status: 'DA_DUYET' });
  }, [decideMutation, feedback?.id]);

  const handleRejectSubmit = useCallback(() => {
    if (!feedback?.id) return;
    decideMutation.mutateAsync({ ids: [feedback.id], status: 'BI_TU_CHOI', reason: rejectReason });
  }, [decideMutation, rejectReason, feedback?.id]);

  const approveDisabled = decideMutation.isPending || !feedback || feedback.status === 'DA_DUYET';
  const rejectDisabled = decideMutation.isPending || !feedback || feedback.status === 'BI_TU_CHOI';

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Phản hồi sinh viên', path: ROUTE_PATHS.ADMIN.FEEDBACK },
      { label: 'Chi tiết phản hồi', path: buildPath.adminFeedbackDetail(id) },
    ]);
    setPageActions([
      {
        key: 'reject',
        label: 'Từ chối',
        icon: <FontAwesomeIcon icon={faXmark} />,
        type: 'default',
        className: 'admin-navbar__btn--danger',
        onClick: handleRejectSubmit,
        disabled: rejectDisabled,
      },
      {
        key: 'approve',
        label: 'Duyệt',
        icon: <FontAwesomeIcon icon={faCheck} />,
        type: 'primary',
        className: 'admin-navbar__btn--success',
        onClick: handleApprove,
        disabled: approveDisabled,
      },
    ]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [
    setBreadcrumbs,
    setPageActions,
    id,
    handleRejectSubmit,
    handleApprove,
    approveDisabled,
    rejectDisabled,
    decideMutation.isLoading,
  ]);

  const statsCards = useMemo(
    () => [
      {
        key: 'total',
        label: 'Tổng minh chứng',
        value: formatNumber(stats.total, isLoading ? '--' : 0),
        color: '#00008B',
        icon: faFileLines,
        bg: '#e8edff',
      },
      {
        key: 'pending',
        label: 'Chờ duyệt',
        value: formatNumber(stats.pending, isLoading ? '--' : 0),
        color: '#DB7B00',
        icon: faHourglassHalf,
        bg: '#fff3e0',
      },
      {
        key: 'approved',
        label: 'Đã duyệt',
        value: formatNumber(stats.approved, isLoading ? '--' : 0),
        color: '#198754',
        icon: faCircleCheck,
        bg: '#e6f8ee',
      },
      {
        key: 'rejected',
        label: 'Từ chối',
        value: formatNumber(stats.rejected, isLoading ? '--' : 0),
        color: '#DC3545',
        icon: faCircleXmark,
        bg: '#fdeaea',
      },
    ],
    [stats, isLoading],
  );

  const attachments = feedback?.attachments ?? [];
  const student = feedback?.student ?? {};
  const activity = feedback?.activity ?? {};
  const participantCountLabel = formatNumber(activity.participantCount, '--');
  const maxParticipantsLabel =
    activity.maxParticipants !== undefined && activity.maxParticipants !== null
      ? formatNumber(activity.maxParticipants, '--')
      : '--';

  if (isLoading) {
    return (
      <ConfigProvider locale={viVN}>
        {contextHolder}
        <div className={cx('detail-page', 'detail-page--loading')}>
          <Spin size="large" />
        </div>
      </ConfigProvider>
    );
  }

  if (isError) {
    if (error?.response?.status === 404) {
      return (
        <ConfigProvider locale={viVN}>
          {contextHolder}
          <Result
            status="404"
            title="Không tìm thấy phản hồi"
            subTitle="Phản hồi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
            extra={
              <Button type="primary" href={ROUTE_PATHS.ADMIN.FEEDBACK}>
                Quay lại danh sách phản hồi
              </Button>
            }
          />
        </ConfigProvider>
      );
    }

    return (
      <ConfigProvider locale={viVN}>
        {contextHolder}
        <Result status="error" title="Đã xảy ra lỗi" subTitle="Không thể tải dữ liệu phản hồi, vui lòng thử lại sau." />
      </ConfigProvider>
    );
  }

  if (!feedback) return null;

  return (
    <ConfigProvider locale={viVN}>
      {contextHolder}

      <div className={cx('detail-page')}>
        <section className={cx('stats__grid')}>
          {statsCards.map((item) => (
            <div key={item.key} className={cx('stats__card')}>
              <div className={cx('stats__info')}>
                <p className={cx('stats__label')}>{item.label}</p>
                <h2 className={cx('stats__value')} style={{ color: item.color }}>
                  {item.value}
                </h2>
              </div>
              <div className={cx('stats__icon-box')} style={{ backgroundColor: item.bg }}>
                <FontAwesomeIcon icon={item.icon} size="lg" color={item.color} />
              </div>
            </div>
          ))}
        </section>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Thông tin hoạt động" className={cx('info-card')}>
                <div className={cx('activity-card__header')}>
                  <h3 className={cx('activity-title')}>{activity.title || 'Hoạt động'}</h3>
                  {activity.pointGroupLabel ? (
                    <Tag className={cx('activity-tag')}>{activity.pointGroupLabel}</Tag>
                  ) : null}
                </div>
                <span className={cx('activity-points')}>
                  <FontAwesomeIcon icon={faStar} />
                  <span>{activity.points ?? 0} điểm</span>
                </span>

                <div className={cx('info-grid')}>
                  <InfoItem icon={faCalendarDays} label="Thời gian">
                    {formatDateTimeRange(activity.startTime, activity.endTime)}
                  </InfoItem>
                  <InfoItem icon={faLocationDot} label="Địa điểm">
                    {activity.location || 'Đang cập nhật'}
                  </InfoItem>
                  <InfoItem icon={faUsers} label="Số lượng tham gia">
                    {participantCountLabel} / {maxParticipantsLabel}
                  </InfoItem>
                  <InfoItem icon={faCalendar} label="Học kỳ - Năm học">
                    {activity.semester && activity.academicYear
                      ? `${activity.semester} - ${activity.academicYear}`
                      : 'Đang cập nhật'}
                  </InfoItem>
                </div>
              </Card>

              <Card
                title="Phản hồi sinh viên"
                className={cx('info-card')}
                extra={<span>Đã gửi: {formatDateTime(feedback.submittedAt)}</span>}
              >
                {/* Nội dung phản hồi */}
                <div className={cx('feedback-section', 'feedback-section--content')}>
                  <Typography.Title level={5} className={cx('section-title')}>
                    Nội dung phản hồi
                  </Typography.Title>
                  <div className={cx('content-box')}>
                    <Paragraph className={cx('content-text')}>{feedback.content}</Paragraph>
                  </div>
                </div>

                {/* Lý do từ chối (nếu có) */}
                {feedback.reason ? (
                  <div className={cx('feedback-section')}>
                    <Typography.Title level={5} className={cx('section-title')}>
                      Lý do từ chối
                    </Typography.Title>
                    <div className={cx('content-box', 'content-box--danger')}>
                      <Paragraph className={cx('content-text')}>{feedback.reason}</Paragraph>
                    </div>
                  </div>
                ) : null}

                {/* File đính kèm */}
                <div className={cx('feedback-section')}>
                  <Typography.Title level={5} className={cx('section-title')}>
                    File minh chứng đính kèm
                  </Typography.Title>

                  {attachments.length ? (
                    <List
                      className={cx('attachment-list')}
                      itemLayout="horizontal"
                      dataSource={attachments}
                      renderItem={(file, index) => {
                        const url = file.url || '#';
                        const sizeLabel = formatFileSize(file.size);
                        const uploadedAt = file.uploadedAt ? formatDateTime(file.uploadedAt) : null;
                        const disabled = !file.url;

                        return (
                          <List.Item
                            className={cx('attachment-item', { '--disabled': disabled })}
                            actions={[
                              <Button
                                key="download"
                                type="text"
                                icon={<FontAwesomeIcon icon={faDownload} />}
                                href={disabled ? undefined : url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => disabled && e.preventDefault()}
                              />,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <div className={cx('file-thumb')}>
                                  <FontAwesomeIcon icon={faFileLines} />
                                </div>
                              }
                              title={<span className={cx('file-name')}>{file.name || `Minh chứng ${index + 1}`}</span>}
                              description={
                                <span className={cx('file-desc')}>
                                  {sizeLabel ? `${sizeLabel}` : '—'}
                                  {uploadedAt ? ` • Tải lên ${uploadedAt}` : ''}
                                </span>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Paragraph type="secondary">Không có minh chứng đính kèm.</Paragraph>
                  )}
                </div>

                <Divider className={cx('footer-divider')} />

                <div className={cx('feedback-status-row')}>
                  <Text type="secondary" strong>
                    Trạng thái phản hồi:
                  </Text>
                  {buildStatusTag(feedback.status, feedback.statusLabel)}
                </div>
              </Card>
            </Space>
          </Col>

          {/* Thông tin sinh viên */}
          <Col xs={24} lg={8}>
            <Card title="Thông tin sinh viên" className={cx('info-card')}>
              <div className={cx('student-summary')}>
                <div className={cx('student-avatar-wrap')}>
                  <Avatar shape="square" size={200} src={student.avatarUrl} alt={student.name}>
                    {student.name?.[0] ?? '?'}
                  </Avatar>
                </div>
              </div>

              <div className={cx('student-grid')}>
                <div className={cx('field')}>
                  <span className={cx('field__label')}>Mã sinh viên</span>
                  <span className={cx('field__value')}>{student.studentCode || '--'}</span>
                </div>
                <div className={cx('field')}>
                  <span className={cx('field__label')}>Khoa</span>
                  <span className={cx('field__value')}>{student.faculty || '--'}</span>
                </div>
                <div className={cx('field')}>
                  <span className={cx('field__label')}>Lớp</span>
                  <span className={cx('field__value')}>{student.className || '--'}</span>
                </div>
                <div className={cx('field')}>
                  <span className={cx('field__label')}>Số điện thoại</span>
                  <span className={cx('field__value')}>{student.phone || '--'}</span>
                </div>
                <div className={cx('field', 'field--full')}>
                  <span className={cx('field__label')}>Email</span>
                  <span className={cx('field__value')}>{student.email || '--'}</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title="Từ chối phản hồi"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason('');
        }}
        onOk={handleRejectSubmit}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ disabled: !rejectReason.trim().length, loading: decideMutation.isPending }}
        cancelButtonProps={{ disabled: decideMutation.isPending }}
        destroyOnClose
      >
        <p>Vui lòng cung cấp lý do từ chối phản hồi này.</p>
        <Paragraph type="secondary">Thông tin này sẽ được gửi tới sinh viên.</Paragraph>
        <Input.TextArea
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Nhập lý do từ chối..."
        />
      </Modal>
    </ConfigProvider>
  );
}

export default FeedbackDetailPage;
