import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  ConfigProvider,
  Input,
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
  faCalendarDays,
  faCheck,
  faChevronRight,
  faCircleCheck,
  faCircleDot,
  faCircleXmark,
  faDownload,
  faFileLines,
  faHome,
  faHourglassHalf,
  faMapPin,
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

// Helper render thẻ thống kê
const StatCard = ({ item }) => (
  <div className={cx('stat-card-mini')}>
    <div className={cx('stat-card-mini__info')}>
      <p className={cx('stat-card-mini__label')}>{item.label}</p>
      <h2 className={cx('stat-card-mini__value')} style={{ color: item.color }}>
        {item.value}
      </h2>
    </div>
    <div className={cx('stat-card-mini__icon-box')} style={{ backgroundColor: item.bg, color: item.color }}>
      <FontAwesomeIcon icon={item.icon} />
    </div>
  </div>
);

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

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Phản hồi sinh viên', path: ROUTE_PATHS.ADMIN.FEEDBACK },
      { label: 'Chi tiết phản hồi', path: buildPath.adminFeedbackDetail(id) },
    ]);
    setPageActions([]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [id, setBreadcrumbs, setPageActions]);

  useEffect(() => {
    if (!feedback?.student?.name) return;
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Phản hồi sinh viên', path: ROUTE_PATHS.ADMIN.FEEDBACK },
      { label: feedback.student.name, path: buildPath.adminFeedbackDetail(id) },
    ]);
  }, [feedback?.student?.name, id, setBreadcrumbs]);

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

  const handleApprove = async () => {
    if (!feedback?.id) return;
    await decideMutation.mutateAsync({ ids: [feedback.id], status: 'DA_DUYET' });
  };

  const handleRejectSubmit = async () => {
    if (!feedback?.id) return;
    await decideMutation.mutateAsync({ ids: [feedback.id], status: 'BI_TU_CHOI', reason: rejectReason });
  };

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
  const approveDisabled = decideMutation.isPending || !feedback || feedback.status === 'DA_DUYET';
  const rejectDisabled = decideMutation.isPending || !feedback || feedback.status === 'BI_TU_CHOI';

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
        <header className={cx('page-header')}>
          <div className={cx('page-header__left')}>
            <Breadcrumb separator={<FontAwesomeIcon icon={faChevronRight} size="xs" />} className={cx('breadcrumb')}>
              <Breadcrumb.Item>
                <Link to={ROUTE_PATHS.ADMIN.DASHBOARD}>
                  <FontAwesomeIcon icon={faHome} /> Trang chủ
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Link to={ROUTE_PATHS.ADMIN.FEEDBACK}>Phản hồi sinh viên</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{student.name || 'Chi tiết phản hồi'}</Breadcrumb.Item>
            </Breadcrumb>
            <div className={cx('page-header__title-block')}>
              <h1 className={cx('page-title')}>{student.name || 'Chi tiết phản hồi'}</h1>
              {buildStatusTag(feedback.status, feedback.statusLabel)}
            </div>
            <p className={cx('page-meta')}>Gửi lúc {formatDateTime(feedback.submittedAt)}</p>
          </div>
          <div className={cx('page-header__right')}>
            <Space size="middle">
              <Button
                danger
                icon={<FontAwesomeIcon icon={faXmark} />}
                size="large"
                onClick={() => {
                  setRejectModalOpen(true);
                  setRejectReason('');
                }}
                disabled={rejectDisabled}
                loading={decideMutation.isPending}
              >
                Từ chối
              </Button>
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon={faCheck} />}
                size="large"
                onClick={handleApprove}
                disabled={approveDisabled}
                loading={decideMutation.isPending}
              >
                Duyệt
              </Button>
            </Space>
          </div>
        </header>

        <section className={cx('stats-mini__grid')}>
          {statsCards.map((item) => (
            <StatCard key={item.key} item={item} />
          ))}
        </section>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Thông tin hoạt động" className={cx('info-card')}>
                <div className={cx('activity-card__header')}>
                  <h3 className={cx('activity-title')}>{activity.title || 'Hoạt động'}</h3>
                  {activity.pointGroupLabel ? (
                    <Tag color="blue" className={cx('activity-tag')}>
                      {activity.pointGroupLabel}
                    </Tag>
                  ) : null}
                </div>
                <span className={cx('activity-points')}>
                  <strong>{activity.points ?? 0}</strong> điểm CTXH
                </span>

                <div className={cx('info-grid')}>
                  <InfoItem icon={faCalendarDays} label="Thời gian">
                    {formatDateTimeRange(activity.startTime, activity.endTime)}
                  </InfoItem>
                  <InfoItem icon={faMapPin} label="Địa điểm">
                    {activity.location || 'Đang cập nhật'}
                  </InfoItem>
                  <InfoItem icon={faUsers} label="Số lượng tham gia">
                    {participantCountLabel} / {maxParticipantsLabel}
                  </InfoItem>
                </div>
              </Card>

              <Card
                title="Phản hồi sinh viên"
                className={cx('info-card')}
                extra={<span>Cập nhật lúc {formatDateTime(feedback.updatedAt)}</span>}
              >
                <div className={cx('feedback-meta')}>
                  <div>
                    <Text type="secondary">Trạng thái</Text>
                    <div>{buildStatusTag(feedback.status, feedback.statusLabel)}</div>
                  </div>
                  <div>
                    <Text type="secondary">Gửi lúc</Text>
                    <div>{formatDateTime(feedback.submittedAt)}</div>
                  </div>
                </div>

                <div className={cx('feedback-content')}>
                  <h4>Nội dung phản hồi</h4>
                  <Paragraph>{feedback.content}</Paragraph>
                </div>
                {feedback.reason ? (
                  <div className={cx('feedback-reject-reason')}>
                    <h4>Lý do từ chối</h4>
                    <Paragraph type="danger">{feedback.reason}</Paragraph>
                  </div>
                ) : null}

                <div className={cx('feedback-attachments')}>
                  <h4>Minh chứng đính kèm</h4>
                  {attachments.length ? (
                    <div className={cx('attachment-list')}>
                      {attachments.map((file, index) => {
                        const url = file.url || '#';
                        const sizeLabel = formatFileSize(file.size);
                        const isDisabled = !file.url;
                        return (
                          <a
                            key={file.id || file.name || index}
                            className={cx('attachment-item', { '--disabled': isDisabled })}
                            href={isDisabled ? undefined : url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => {
                              if (isDisabled) event.preventDefault();
                            }}
                          >
                            <FontAwesomeIcon icon={faDownload} />
                            <span>{file.name || 'Minh chứng'}</span>
                            {sizeLabel ? <small>{sizeLabel}</small> : null}
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <Paragraph type="secondary">Không có minh chứng đính kèm.</Paragraph>
                  )}
                </div>
              </Card>
            </Space>
          </Col>

          {/* Cột phải */}
          <Col xs={24} lg={8}>
            <Card title="Thông tin sinh viên" className={cx('info-card')}>
              <div className={cx('student-summary')}>
                <Avatar size={72} src={student.avatarUrl} alt={student.name}>
                  {student.name?.[0] ?? '?'}
                </Avatar>
                <div className={cx('student-summary__details')}>
                  <h3>{student.name || 'Sinh viên'}</h3>
                  <p>{student.email || '—'}</p>
                </div>
              </div>
              <div className={cx('student-metadata')}>
                <div>
                  <span>MSSV</span>
                  <strong>{student.studentCode || '--'}</strong>
                </div>
                <div>
                  <span>Khoa</span>
                  <strong>{student.faculty || '--'}</strong>
                </div>
                <div>
                  <span>Lớp</span>
                  <strong>{student.className || '--'}</strong>
                </div>
                <div>
                  <span>Điện thoại</span>
                  <strong>{student.phone || '--'}</strong>
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
