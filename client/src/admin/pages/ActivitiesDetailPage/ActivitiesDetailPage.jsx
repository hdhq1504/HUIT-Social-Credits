import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Tabs,
  Row,
  Col,
  Tag,
  Image,
  Spin,
  Empty,
  Modal,
  ConfigProvider,
  Table,
  Avatar,
  List,
  Card,
  Statistic,
  Select,
  Button,
  Space,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faClock,
  faMapPin,
  faCalendarDay,
  faStar,
  faUsers,
  faCircleCheck,
  faTriangleExclamation,
  faListCheck,
  faPenToSquare,
  faTrash,
  faCircleDot,
  faClipboardList,
  faSchool,
  faCalendarDays,
  faCheck,
  faXmark,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@/api/activities.api';
import { normalizeGuideItems, normalizeStringItems } from '@utils/content';
import { sanitizeHtml } from '@/utils/sanitize';
import useToast from '@/components/Toast/Toast';
import fallbackImage from '@/assets/images/fallback-cover.png';
import styles from './ActivitiesDetailPage.module.scss';

const cx = classNames.bind(styles);
const { TabPane } = Tabs;

const ATTENDANCE_METHOD_LABELS = {
  qr: 'QR Code',
  photo: 'Chụp Ảnh',
};

const REGISTRATION_STATUS_DISPLAY = {
  DANG_KY: { label: 'Đã đăng ký', color: 'processing', variant: 'registered' },
  DANG_THAM_GIA: { label: 'Đang tham gia', color: 'success', variant: 'in-progress' },
  DA_THAM_GIA: { label: 'Đã tham gia', color: 'success', variant: 'joined' },
  DA_HUY: { label: 'Đã hủy', color: 'default', variant: 'canceled' },
  VANG_MAT: { label: 'Vắng mặt', color: 'error', variant: 'absent' },
  CHO_DUYET: { label: 'Chờ duyệt', color: 'warning', variant: 'pending' },
};

const FEEDBACK_STATUS_DISPLAY = {
  CHO_DUYET: { label: 'Chờ duyệt', color: 'warning', variant: 'pending' },
  DA_DUYET: { label: 'Đã duyệt', color: 'success', variant: 'approved' },
  BI_TU_CHOI: { label: 'Bị từ chối', color: 'error', variant: 'rejected' },
};

const resolveAttendanceLabel = (method, label) => {
  if (label) return label;
  if (!method) return '--';
  return ATTENDANCE_METHOD_LABELS[method] || '--';
};

// === Helpers ===
const formatDateTime = (isoString, format = 'DD/MM/YYYY HH:mm') => {
  if (!isoString) return '--';
  return dayjs(isoString).format(format);
};

const getStatusTag = (status) => {
  switch (status) {
    case 'ongoing':
    case 'check_in':
    case 'check_out':
    case 'confirm_out':
      return (
        <Tag className={cx('activity-detail__status-tag', 'activity-detail__status-tag--ongoing')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('activity-detail__status-icon')} />
          Đang diễn ra
        </Tag>
      );
    case 'upcoming':
    case 'guest':
    case 'registered':
    case 'attendance_closed':
      return (
        <Tag className={cx('activity-detail__status-tag', 'activity-detail__status-tag--upcoming')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('activity-detail__status-icon')} />
          Sắp diễn ra
        </Tag>
      );
    case 'ended':
    case 'feedback_pending':
    case 'feedback_reviewing':
    case 'completed':
    case 'feedback_accepted':
      return (
        <Tag className={cx('activity-detail__status-tag', 'activity-detail__status-tag--ended')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('activity-detail__status-icon')} />
          Đã kết thúc
        </Tag>
      );
    default:
      return <Tag>{status || 'Không rõ'}</Tag>;
  }
};

const getRegistrationStatusTag = (status) => {
  const meta = REGISTRATION_STATUS_DISPLAY[status] || {
    label: status || 'Không rõ',
    variant: 'default',
  };

  const variant = meta.variant || 'default';
  const modifierClass = `activity-detail__registration-status-tag--${variant}`;

  return <Tag className={cx('activity-detail__registration-status-tag', modifierClass)}>{meta.label}</Tag>;
};

const getFeedbackStatusTag = (status) => {
  const meta = FEEDBACK_STATUS_DISPLAY[status] || {
    label: status || 'Không rõ',
    variant: 'default',
  };

  const variant = meta.variant || 'default';
  const modifierClass = `activity-detail__feedback-status-tag--${variant}`;

  return <Tag className={cx('activity-detail__feedback-status-tag', modifierClass)}>{meta.label}</Tag>;
};

const InfoItem = ({ icon, label, value }) => (
  <div className={cx('activity-detail__item')}>
    <div className={cx('activity-detail__item-icon-wrapper')}>
      <FontAwesomeIcon icon={icon} className={cx('activity-detail__item-icon')} />
    </div>
    <div className={cx('activity-detail__item-text')}>
      <span className={cx('activity-detail__item-label')}>{label}</span>
      <p className={cx('activity-detail__item-value')}>{value}</p>
    </div>
  </div>
);

const getInitials = (value = '') =>
  value
    .toString()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SV';

function ActivitiesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contextHolder, open: openToast } = useToast();
  const { setPageActions, setBreadcrumbs } = useContext(AdminPageContext);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('ALL');

  const {
    data: activity,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY, 'detail', id],
    queryFn: () => activitiesApi.detail(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => activitiesApi.remove(id),
    onSuccess: () => {
      openToast({ message: 'Xóa hoạt động thành công!', variant: 'success' });
      queryClient.invalidateQueries(ACTIVITIES_QUERY_KEY);
      navigate(ROUTE_PATHS.ADMIN.ACTIVITIES);
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Xóa thất bại, vui lòng thử lại.', variant: 'danger' });
    },
  });

  // Handlers
  const handleDelete = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();
    } finally {
      setDeleteModalOpen(false);
    }
  }, [deleteMutation]);

  // Breadcrums
  useEffect(() => {
    if (activity) {
      setBreadcrumbs([
        { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
        { label: 'Danh sách hoạt động', path: ROUTE_PATHS.ADMIN.ACTIVITIES },
        { label: activity.title },
      ]);

      setPageActions([
        {
          key: 'delete',
          label: deleteMutation.isLoading ? 'Đang xóa...' : 'Xóa hoạt động',
          icon: <FontAwesomeIcon icon={faTrash} />,
          type: 'default',
          danger: true,
          className: 'admin-navbar__btn--danger-outline',
          onClick: handleDelete,
          disabled: deleteMutation.isLoading,
        },
        {
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <FontAwesomeIcon icon={faPenToSquare} />,
          type: 'primary',
          className: 'admin-navbar__btn--orange',
          onClick: () => navigate(buildPath.adminActivityEdit(id)),
          disabled: deleteMutation.isLoading,
        },
      ]);
    }

    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setPageActions, setBreadcrumbs, navigate, id, activity, deleteMutation.isLoading, handleDelete]);

  const requirementItems = useMemo(() => normalizeStringItems(activity?.requirements), [activity?.requirements]);
  const guideSteps = useMemo(() => normalizeGuideItems(activity?.guidelines), [activity?.guidelines]);
  const safeDescription = useMemo(() => sanitizeHtml(activity?.description ?? ''), [activity?.description]);

  const buildListItemKey = useCallback((item, index) => {
    const rawKey = typeof item === 'string' ? item : item?.content || item?.title || index;
    return `${index}-${String(rawKey).slice(0, 30)}`;
  }, []);

  const renderListSection = useCallback(
    (items, emptyDescription, icon, iconClass) =>
      items.length ? (
        <ul className={cx('activity-detail__list')}>
          {items.map((item, index) => (
            <li key={buildListItemKey(item, index)} className={cx('activity-detail__list-item')}>
              <FontAwesomeIcon icon={icon} className={cx('activity-detail__list-icon', iconClass)} />
              {typeof item === 'string' ? (
                <span>{item}</span>
              ) : (
                <div>
                  {item.title && <strong className={cx('activity-detail__list-item-title')}>{item.title}</strong>}
                  <span>{item.content}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    [buildListItemKey],
  );

  // Sinh viên tham gia
  const participantData = useMemo(
    () =>
      (activity?.participantRegistrations ?? [])
        .map((registration, index) => ({
          key: registration.id || `registration-${index}`,
          order: index + 1,
          ...registration,
          user: registration.student || registration.user || null,
        }))
        .sort((a, b) => {
          const aTime = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
          const bTime = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
          return bTime - aTime;
        }),
    [activity?.participantRegistrations],
  );

  const participantColumns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'order',
        key: 'order',
        width: 70,
        align: 'center',
      },
      {
        title: 'Sinh viên',
        dataIndex: 'user',
        key: 'user',
        render: (user) => {
          if (!user) return <span>--</span>;
          return (
            <div className={cx('activity-detail__student-cell')}>
              <Avatar src={user.avatarUrl} className={cx('activity-detail__student-avatar')}>
                {getInitials(user.name)}
              </Avatar>
              <div className={cx('activity-detail__student-info')}>
                <span className={cx('activity-detail__student-name')}>{user.name}</span>
                <span className={cx('activity-detail__student-email')}>{user.email || '---'}</span>
              </div>
            </div>
          );
        },
      },
      {
        title: 'MSSV',
        dataIndex: ['user', 'studentCode'],
        key: 'studentCode',
        render: (value) => value || '---',
      },
      {
        title: 'Khoa',
        dataIndex: ['user', 'faculty'],
        key: 'faculty',
        render: (value) => value || '---',
      },
      {
        title: 'Lớp',
        dataIndex: ['user', 'className'],
        key: 'className',
        render: (value) => value || '---',
      },
      {
        title: 'Đăng ký lúc',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        render: (value) => formatDateTime(value) || '--',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status) => getRegistrationStatusTag(status),
      },
    ],
    [],
  );

  // Nhật ký phản hồi
  const feedbackLogs = useMemo(() => {
    if (!Array.isArray(activity?.feedbackLogs)) return [];
    return activity.feedbackLogs
      .map((item, index) => ({
        key: item.id || `feedback-${index}`,
        ...item,
      }))
      .sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [activity?.feedbackLogs]);

  const feedbackSummary = useMemo(() => {
    const summary = {
      total: feedbackLogs.length,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    feedbackLogs.forEach((item) => {
      switch (item.status) {
        case 'DA_DUYET':
          summary.approved += 1;
          break;
        case 'CHO_DUYET':
          summary.pending += 1;
          break;
        case 'BI_TU_CHOI':
          summary.rejected += 1;
          break;
        default:
          break;
      }
    });

    return summary;
  }, [feedbackLogs]);

  const filteredFeedbackLogs = useMemo(
    () =>
      feedbackStatusFilter === 'ALL'
        ? feedbackLogs
        : feedbackLogs.filter((item) => item.status === feedbackStatusFilter),
    [feedbackLogs, feedbackStatusFilter],
  );

  // Loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !activity) {
    return <Empty description="Không tìm thấy dữ liệu hoạt động" style={{ marginTop: '10vh' }} />;
  }

  return (
    <ConfigProvider locale={viVN}>
      {contextHolder}

      <div className={cx('activity-detail')}>
        <section className={cx('activity-detail__card')}>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8} lg={6}>
              <Image
                src={activity.coverImage || fallbackImage}
                alt={activity.title}
                className={cx('activity-detail__image')}
                preview={false}
              />
            </Col>
            <Col xs={24} md={16} lg={18}>
              <div className={cx('activity-detail__info')}>
                <h2 className={cx('activity-detail__title')}>{activity.title}</h2>
                <div className={cx('activity-detail__meta')}>
                  <Tag className={cx('activity-detail__badge')}>{activity.pointGroupLabel || 'Hoạt động'}</Tag>
                  <span className={cx('activity-detail__points')}>
                    <FontAwesomeIcon icon={faStar} /> {activity.points || 0} điểm
                  </span>
                </div>

                <Row gutter={[16, 16]} className={cx('activity-detail__grid')}>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem icon={faUser} label="Người phụ trách" value={activity.organizer || 'TS. Nguyễn Văn An'} />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem
                      icon={faCalendarDay}
                      label="Hạn đăng ký"
                      value={formatDateTime(activity.registrationDeadline, 'HH:mm, DD/MM/YYYY') || '--'}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem
                      icon={faTriangleExclamation}
                      label="Hạn hủy đăng ký"
                      value={formatDateTime(activity.cancellationDeadline, 'HH:mm, DD/MM/YYYY') || '--'}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem icon={faClock} label="Thời gian" value={activity.dateTime || '--'} />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem icon={faUsers} label="Số lượng tham gia" value={activity.capacity || '0/0'} />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem icon={faMapPin} label="Địa điểm" value={activity.location || '--'} />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem icon={faSchool} label="Học kỳ" value={activity.semester || '--'} />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem icon={faCalendarDays} label="Năm học" value={activity.academicYear || '--'} />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <InfoItem
                      icon={faListCheck}
                      label="Phương thức điểm danh"
                      value={resolveAttendanceLabel(activity.attendanceMethod, activity.attendanceMethodLabel)}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <div className={cx('activity-detail__item')}>
                      <div className={cx('activity-detail__item-icon-wrapper')}>
                        <FontAwesomeIcon icon={faCircleCheck} className={cx('activity-detail__item-icon')} />
                      </div>
                      <div className={cx('activity-detail__item-text')}>
                        <span className={cx('activity-detail__item-label')}>Trạng thái</span>
                        <div className={cx('activity-detail__item-value')}>{getStatusTag(activity.state)}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </section>

        <section className={cx('activity-detail__tabs-container')}>
          <Tabs defaultActiveKey="details" className={cx('activity-detail__tabs')}>
            <TabPane tab="Thông tin chi tiết" key="details" className={cx('activity-detail__tab-pane')}>
              <div className={cx('activity-detail__rich-section')}>
                <h3 className={cx('activity-detail__list-title')}>Giới thiệu hoạt động</h3>
                {safeDescription ? (
                  <div
                    className={cx('activity-detail__rich-text')}
                    dangerouslySetInnerHTML={{ __html: safeDescription }}
                  />
                ) : (
                  <Empty description="Chưa có mô tả chi tiết" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>

              <div className={cx('activity-detail__details-grid')}>
                <div className={cx('activity-detail__list-section')}>
                  <h3 className={cx('activity-detail__list-title')}>Yêu cầu tham gia</h3>
                  {renderListSection(
                    requirementItems,
                    'Chưa có yêu cầu tham gia',
                    faListCheck,
                    'activity-detail__list-icon--primary',
                  )}
                </div>
                <div className={cx('activity-detail__list-section')}>
                  <h3 className={cx('activity-detail__list-title')}>Hướng dẫn tham gia</h3>
                  {renderListSection(
                    guideSteps,
                    'Chưa có hướng dẫn tham gia',
                    faClipboardList,
                    'activity-detail__list-icon--primary',
                  )}
                </div>
              </div>
            </TabPane>

            <TabPane tab="Sinh viên tham gia" key="participants" className={cx('activity-detail__tab-pane')}>
              <div className={cx('activity-detail__table-wrapper')}>
                <Table
                  columns={participantColumns}
                  dataSource={participantData}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  locale={{
                    emptyText: <Empty description="Chưa có sinh viên tham gia" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                  }}
                  rowKey="key"
                />
              </div>
            </TabPane>

            <TabPane tab="Nhật ký phản hồi" key="feedback" className={cx('activity-detail__tab-pane')}>
              <div className={cx('activity-detail__feedback-log')}>
                <div className={cx('activity-detail__feedback-log-card')}>
                  <div className={cx('activity-detail__feedback-log-header')}>
                    <Row gutter={[16, 16]} className={cx('activity-detail__feedback-summary-row')}>
                      <Col xs={12} md={6}>
                        <Card
                          bordered={false}
                          className={cx(
                            'activity-detail__feedback-summary-item',
                            'activity-detail__feedback-summary-item--total',
                          )}
                        >
                          <Statistic title="Tổng phản hồi" value={feedbackSummary.total} />
                        </Card>
                      </Col>
                      <Col xs={12} md={6}>
                        <Card
                          bordered={false}
                          className={cx(
                            'activity-detail__feedback-summary-item',
                            'activity-detail__feedback-summary-item--approved',
                          )}
                        >
                          <Statistic title="Đã duyệt" value={feedbackSummary.approved} />
                        </Card>
                      </Col>
                      <Col xs={12} md={6}>
                        <Card
                          bordered={false}
                          className={cx(
                            'activity-detail__feedback-summary-item',
                            'activity-detail__feedback-summary-item--pending',
                          )}
                        >
                          <Statistic title="Chờ duyệt" value={feedbackSummary.pending} />
                        </Card>
                      </Col>
                      <Col xs={12} md={6}>
                        <Card
                          bordered={false}
                          className={cx(
                            'activity-detail__feedback-summary-item',
                            'activity-detail__feedback-summary-item--rejected',
                          )}
                        >
                          <Statistic title="Từ chối" value={feedbackSummary.rejected} />
                        </Card>
                      </Col>
                    </Row>
                  </div>

                  <div className={cx('activity-detail__feedback-toolbar')}>
                    <Select
                      className={cx('activity-detail__feedback-filter')}
                      value={feedbackStatusFilter}
                      onChange={setFeedbackStatusFilter}
                      options={[
                        { label: 'Tất cả trạng thái', value: 'ALL' },
                        { label: FEEDBACK_STATUS_DISPLAY.CHO_DUYET.label, value: 'CHO_DUYET' },
                        { label: FEEDBACK_STATUS_DISPLAY.DA_DUYET.label, value: 'DA_DUYET' },
                        { label: FEEDBACK_STATUS_DISPLAY.BI_TU_CHOI.label, value: 'BI_TU_CHOI' },
                      ]}
                    />

                    <Space>
                      <Button
                        type="primary"
                        className={cx(
                          'activity-detail__feedback-bulk-btn',
                          'activity-detail__feedback-bulk-btn--approve',
                        )}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Duyệt tất cả
                      </Button>
                      <Button
                        type="primary"
                        className={cx(
                          'activity-detail__feedback-bulk-btn',
                          'activity-detail__feedback-bulk-btn--reject',
                        )}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                        Từ chối tất cả
                      </Button>
                    </Space>
                  </div>

                  {/* Danh sách phản hồi */}
                  <div className={cx('activity-detail__feedback-list-wrapper')}>
                    {filteredFeedbackLogs.length ? (
                      <List
                        itemLayout="vertical"
                        dataSource={filteredFeedbackLogs}
                        renderItem={(item) => {
                          return (
                            <List.Item key={item.key} className={cx('activity-detail__feedback-item')}>
                              <div className={cx('activity-detail__feedback-item-inner')}>
                                <div className={cx('activity-detail__feedback-item-left')}>
                                  <Avatar
                                    src={item.student?.avatarUrl}
                                    className={cx('activity-detail__student-avatar')}
                                  >
                                    {getInitials(item.student?.name)}
                                  </Avatar>

                                  <div className={cx('activity-detail__feedback-content-wrapper')}>
                                    <div className={cx('activity-detail__feedback-title-row')}>
                                      <span className={cx('activity-detail__feedback-student-name')}>
                                        {item.student?.name || 'Sinh viên'}
                                      </span>
                                      {item.student?.studentCode && (
                                        <span className={cx('activity-detail__feedback-student-code')}>
                                          {item.student.studentCode}
                                        </span>
                                      )}
                                    </div>

                                    <div className={cx('activity-detail__feedback-text')}>
                                      {item.content || 'Không có nội dung phản hồi.'}
                                    </div>

                                    <div className={cx('activity-detail__feedback-meta-row')}>
                                      <span>{formatDateTime(item.submittedAt) || '--'}</span>
                                      {getFeedbackStatusTag(item.status)}
                                    </div>
                                  </div>
                                </div>

                                <div className={cx('activity-detail__feedback-item-right')}>
                                  <button
                                    type="button"
                                    className={cx(
                                      'activity-detail__feedback-action-btn',
                                      'activity-detail__feedback-action-btn--view',
                                    )}
                                    onClick={() => navigate(buildPath.adminFeedbackDetail(activity.id))}
                                  >
                                    <FontAwesomeIcon icon={faEye} />
                                  </button>
                                  <Button
                                    className={cx(
                                      'activity-detail__feedback-action-btn',
                                      'activity-detail__feedback-action-btn--approve',
                                    )}
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                    Duyệt
                                  </Button>
                                  <Button
                                    className={cx(
                                      'activity-detail__feedback-action-btn',
                                      'activity-detail__feedback-action-btn--reject',
                                    )}
                                  >
                                    <FontAwesomeIcon icon={faXmark} />
                                    Từ chối
                                  </Button>
                                </div>
                              </div>
                            </List.Item>
                          );
                        }}
                      />
                    ) : (
                      <Empty description="Chưa có phản hồi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </div>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </section>
      </div>

      {/* Delete modal */}
      <Modal
        open={isDeleteModalOpen}
        title="Bạn có chắc chắn muốn xóa?"
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        confirmLoading={deleteMutation.isLoading}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destroyOnClose
        centered
      >
        <p>Hoạt động "{activity?.title}" sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
      </Modal>
    </ConfigProvider>
  );
}

export default ActivitiesDetailPage;
