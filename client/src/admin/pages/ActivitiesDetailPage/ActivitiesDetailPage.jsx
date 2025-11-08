import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, Row, Col, Tag, Image, Spin, Empty, Modal, ConfigProvider } from 'antd';
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
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@/api/activities.api';
import { normalizeGuideItems, normalizeStringItems } from '@utils/content';
import { sanitizeHtml } from '@/utils/sanitize';
import useToast from '@/components/Toast/Toast';
import styles from './ActivitiesDetailPage.module.scss';

const cx = classNames.bind(styles);
const { TabPane } = Tabs;

const ATTENDANCE_METHOD_LABELS = {
  qr: 'QR Code',
  photo: 'Chụp ảnh',
  manual: 'Thủ công',
};

const resolveAttendanceLabel = (method, label) => {
  if (label) return label;
  if (!method) return '--';
  return ATTENDANCE_METHOD_LABELS[method] || '--';
};

// === Helpers ===
const formatDateTime = (isoString, format = 'HH:mm [ngày] DD/MM/YYYY') => {
  if (!isoString) return '--';
  return dayjs(isoString).format(format);
};

const getStatusTag = (status) => {
  switch (status) {
    case 'ongoing':
    case 'attendance_open':
    case 'confirm_in':
    case 'confirm_out':
      return (
        <Tag className={cx('activity-detail__status-tag', '--ongoing')}>
          <FontAwesomeIcon icon={faCircleDot} />
          Đang diễn ra
        </Tag>
      );
    case 'upcoming':
    case 'registered':
    case 'attendance_closed':
      return (
        <Tag className={cx('activity-detail__status-tag', '--upcoming')}>
          <FontAwesomeIcon icon={faCircleDot} />
          Sắp diễn ra
        </Tag>
      );
    case 'ended':
    case 'feedback_pending':
    case 'feedback_reviewing':
    case 'feedback_accepted':
      return (
        <Tag className={cx('activity-detail__status-tag', '--ended')}>
          <FontAwesomeIcon icon={faCircleDot} />
          Đã kết thúc
        </Tag>
      );
    default:
      return <Tag>{status || 'Không rõ'}</Tag>;
  }
};

// Component con cho các ô thông tin
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

function ActivitiesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPageActions, setBreadcrumbs } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

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
                src={activity.coverImage || 'https://placehold.co/250x250/eeee/00008B?text=HUIT'}
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

        <section className={cx('activity-detail__content-box')}>
          <div className={cx('activity-detail__rich-section')}>
            <h3 className={cx('activity-detail__list-title')}>Mô tả chi tiết</h3>
            {safeDescription ? (
              <div className={cx('activity-detail__rich-text')} dangerouslySetInnerHTML={{ __html: safeDescription }} />
            ) : (
              <Empty description="Chưa có mô tả chi tiết" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </section>

        <div className={cx('activity-detail__tabs-container')}>
          <Tabs defaultActiveKey="requirements" className={cx('activity-detail__tabs')}>
            <TabPane tab="Giới thiệu chi tiết" key="requirements" className={cx('activity-detail__tab-pane')}>
              <h3 className={cx('activity-detail__list-title')}>Yêu cầu tham gia</h3>
              {renderListSection(requirementItems, 'Chưa có yêu cầu tham gia', faListCheck, '--primary')}
            </TabPane>

            <TabPane tab="Hướng dẫn tham gia" key="guide" className={cx('activity-detail__tab-pane')}>
              <h3 className={cx('activity-detail__list-title')}>Quy trình tham gia</h3>
              {renderListSection(guideSteps, 'Chưa có hướng dẫn tham gia', faClipboardList, '--primary')}
            </TabPane>
          </Tabs>
        </div>
      </div>

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
