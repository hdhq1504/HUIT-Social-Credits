import React, { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCircleCheck,
  faClipboardList,
  faEnvelope,
  faPhone,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Tabs, Empty } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, CardActivity, CheckModal, RegisterModal, FeedbackModal, Label, useToast } from '@components/index';
import Loading from '@pages/Loading';
import activitiesApi from '@api/activities.api';
import { fileToDataUrl } from '@utils/file';
import { formatDate, formatDateTime, formatTimeRange } from '@utils/datetime';
import { normalizeGuideItems, normalizeStringItems } from '@utils/content';
import styles from './ActivityDetailPage.module.scss';

const cx = classNames.bind(styles);

function ActivityDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState('confirm');
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [attendancePhase, setAttendancePhase] = useState('checkin');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { contextHolder, open: toast } = useToast();

  // Lấy chi tiết hoạt động từ API và tận dụng cache của React Query để giảm số lần tải lại.
  const {
    data: activity,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.detail(id),
    enabled: !!id,
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  // Gợi ý thêm hoạt động liên quan
  const { data: relatedActivities = [] } = useQuery({
    queryKey: ['activities', 'related', id],
    queryFn: async () => {
      const list = await activitiesApi.list();
      return list.filter((item) => item.id !== id).slice(0, 4);
    },
    enabled: !!id && !loading,
    staleTime: 60000, // Consider data fresh for 1 minute
    cacheTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  const notFound = isError && error?.response?.status === 404;
  const viewState = activity?.state ?? 'guest';

  const capacityInfo = useMemo(() => {
    if (!activity) return { current: 0, total: 0, hasLimit: false };
    const current = activity.participantsCount ?? 0;
    const hasLimit = typeof activity.maxCapacity === 'number' && activity.maxCapacity > 0;
    const total = hasLimit ? activity.maxCapacity : Math.max(current, 1);
    return { current, total, hasLimit };
  }, [activity]);

  const remaining = capacityInfo.hasLimit ? Math.max(capacityInfo.total - capacityInfo.current, 0) : 0;
  const percent =
    capacityInfo.total > 0 ? Math.min(100, Math.round((capacityInfo.current / capacityInfo.total) * 100)) : 0;

  const handleOpenRegister = () => {
    setModalVariant('confirm');
    setIsRegisterOpen(true);
  };

  const handleOpenCancel = () => {
    setModalVariant('cancel');
    setIsRegisterOpen(true);
  };

  // Các mutation xử lý đăng ký và huỷ giúp đồng bộ lại giao diện ngay sau khi thao tác.
  const registerMutation = useMutation({
    mutationFn: ({ variant, id, reason, note }) => {
      if (variant === 'cancel') {
        return activitiesApi.cancel(id, { reason, note });
      }
      return activitiesApi.register(id, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['activity', id]);
      queryClient.invalidateQueries(['activities', 'related', id]);
      setIsRegisterOpen(false);
      toast({
        message: modalVariant === 'cancel' ? 'Hủy đăng ký thành công.' : 'Đăng ký hoạt động thành công!',
        variant: 'success',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Thao tác thất bại. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ id: activityId, payload }) => activitiesApi.attendance(activityId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['activity', id]);
      setIsCheckOpen(false);
      setAttendancePhase('checkin');
      const message = data?.message || 'Điểm danh thành công!';
      toast({ message, variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Điểm danh thất bại. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const handleConfirmRegister = async ({ variant, reason, note }) => {
    if (!id) return;
    registerMutation.mutate({ variant, id, reason, note });
  };

  const handleAttendanceSubmit = async ({ file, dataUrl }) => {
    if (!id) return;

    let evidenceDataUrl = dataUrl ?? null;
    if (!evidenceDataUrl && file) {
      try {
        evidenceDataUrl = await fileToDataUrl(file);
      } catch {
        toast({ message: 'Không thể đọc dữ liệu ảnh điểm danh. Vui lòng thử lại.', variant: 'danger' });
        return;
      }
    }

    attendanceMutation.mutate({
      id,
      payload: {
        status: 'present',
        phase: attendancePhase,
        evidence: evidenceDataUrl
          ? {
              data: evidenceDataUrl,
              mimeType: file?.type,
              fileName: file?.name,
            }
          : undefined,
      },
    });
  };

  // Chuẩn hoá các trường JSON dạng danh sách để đảm bảo giao diện gọn gàng.
  const benefitItems = useMemo(() => normalizeStringItems(activity?.benefits), [activity?.benefits]);

  const responsibilityItems = useMemo(
    () => normalizeStringItems(activity?.responsibilities),
    [activity?.responsibilities],
  );

  const requirementItems = useMemo(() => normalizeStringItems(activity?.requirements), [activity?.requirements]);

  const guideSteps = useMemo(() => normalizeGuideItems(activity?.guidelines), [activity?.guidelines]);

  // Hàm tạo key ổn định để React không phải re-render toàn bộ danh sách khi dữ liệu thay đổi nhẹ.
  const buildListItemKey = useCallback((item, index) => {
    const rawKey = typeof item === 'string' ? item : item?.content || item?.title || index;
    return `${index}-${String(rawKey).slice(0, 30)}`;
  }, []);

  // Tái sử dụng cùng một logic render danh sách có icon ở nhiều tab khác nhau.
  const renderListSection = useCallback(
    (items, emptyDescription, renderContent) =>
      items.length ? (
        <ul className={cx('activity-detail__requirement-list')}>
          {items.map((item, index) => (
            <li key={buildListItemKey(item, index)} className={cx('activity-detail__requirement-item')}>
              <FontAwesomeIcon icon={faClipboardList} className={cx('activity-detail__requirement-icon')} />
              {renderContent(item, index)}
            </li>
          ))}
        </ul>
      ) : (
        <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    [buildListItemKey],
  );

  const tabItems = useMemo(
    () => [
      {
        key: '1',
        label: (
          <div className={cx('activity-detail__tab-label')}>
            <span>Giới thiệu chi tiết</span>
          </div>
        ),
        children: (
          <div className={cx('activity-detail__tab-panel')}>
            <h4 className={cx('activity-detail__section-title')}>Yêu cầu tham gia</h4>
            {renderListSection(requirementItems, 'Chưa có yêu cầu tham gia', (item) => (
              <span className={cx('activity-detail__requirement-text')}>{item}</span>
            ))}
          </div>
        ),
      },
      {
        key: '2',
        label: (
          <div className={cx('activity-detail__tab-label')}>
            <span>Hướng dẫn tham gia</span>
          </div>
        ),
        children: (
          <div className={cx('activity-detail__tab-panel')}>
            <h4 className={cx('activity-detail__section-title')}>Quy trình tham gia</h4>
            {renderListSection(guideSteps, 'Chưa có hướng dẫn tham gia', (item) => (
              <div className={cx('activity-detail__requirement-text')}>
                {item.title && <strong className={cx('activity-detail__requirement-title')}>{item.title}</strong>}
                <span>{item.content}</span>
              </div>
            ))}
          </div>
        ),
      },
    ],
    [guideSteps, renderListSection, requirementItems],
  );

  const renderActionButton = () => {
    if (!activity) return null;

    const nextPhase = activity?.registration?.attendanceSummary?.nextPhase ?? 'checkin';
    const openAttendance = (phase = nextPhase) => {
      setAttendancePhase(phase);
      setIsCheckOpen(true);
    };

    switch (viewState) {
      case 'guest':
        return (
          <Button
            className={cx('activity-detail__sidebar-button')}
            variant="primary"
            onClick={handleOpenRegister}
            disabled={capacityInfo.hasLimit && remaining <= 0}
          >
            Đăng ký ngay
          </Button>
        );
      case 'registered':
        return (
          <Button className={cx('activity-detail__sidebar-button')} variant="danger" onClick={handleOpenCancel}>
            Hủy đăng ký
          </Button>
        );
      case 'attendance_open':
        return (
          <Button
            className={cx('activity-detail__sidebar-button')}
            variant="primary"
            onClick={() => openAttendance(nextPhase)}
            disabled={attendanceMutation.isPending}
          >
            Điểm danh
          </Button>
        );
      case 'confirm_in':
        return (
          <Button
            className={cx('activity-detail__sidebar-button')}
            variant="primary"
            onClick={() => openAttendance('checkin')}
            disabled={attendanceMutation.isPending}
          >
            Tham gia
          </Button>
        );
      case 'confirm_out':
        return (
          <Button
            className={cx('activity-detail__sidebar-button')}
            variant="orange"
            onClick={() => openAttendance('checkout')}
            disabled={attendanceMutation.isPending}
          >
            Hoàn tất
          </Button>
        );
      case 'attendance_closed':
        return (
          <>
            <Button className={cx('activity-detail__sidebar-button')} variant="danger" onClick={handleOpenCancel}>
              Hủy đăng ký
            </Button>
            <p className={cx('activity-detail__sidebar-hint')}>
              Điểm danh chỉ khả dụng trong thời gian hoạt động đang diễn ra. Vui lòng quay lại sau.
            </p>
          </>
        );
      case 'feedback_pending':
        return (
          <Button
            className={cx('activity-detail__sidebar-button')}
            variant="orange"
            onClick={() => setIsFeedbackOpen(true)}
          >
            Gửi phản hồi
          </Button>
        );
      case 'feedback_reviewing':
        return (
          <Button className={cx('activity-detail__sidebar-button')} variant="muted" disabled>
            Đã gửi
          </Button>
        );
      case 'feedback_accepted':
        return (
          <Button className={cx('activity-detail__sidebar-button')} variant="muted" disabled>
            Hoàn thành
          </Button>
        );
      case 'feedback_denied':
        return (
          <Link to="/feedback">
            <Button className={cx('activity-detail__sidebar-button')} variant="muted" disabled>
              Đã từ chối
            </Button>
          </Link>
        );
      case 'canceled':
        return (
          <Button className={cx('activity-detail__sidebar-button')} variant="muted" disabled>
            Đã hủy đăng ký
          </Button>
        );
      case 'ended':
      default:
        return (
          <Button className={cx('activity-detail__sidebar-button')} variant="muted" disabled>
            Đã kết thúc
          </Button>
        );
    }
  };

  return (
    <section className={cx('activity-detail')}>
      {contextHolder}

      <div className={cx('activity-detail__container')}>
        {loading && <Loading />}

        {!loading && notFound && (
          <div className={cx('activity-detail__empty')}>
            <h2 className={cx('activity-detail__empty-title')}>Hoạt động không tồn tại</h2>
            <p className={cx('activity-detail__empty-subtitle')}>
              Có thể hoạt động đã bị gỡ hoặc bạn đã nhập sai đường dẫn.
            </p>
            <Link to="/list-activities" className={cx('activity-detail__empty-link')}>
              Quay lại danh sách hoạt động
            </Link>
          </div>
        )}

        {!loading && activity && (
          <>
            <nav className={cx('activity-detail__breadcrumb')}>
              <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> /{' '}
              <span>{activity.title}</span>
            </nav>

            <div className={cx('activity-detail__layout')}>
              <div className={cx('activity-detail__card')}>
                <div className={cx('activity-detail__header')}>
                  <div className={cx('activity-detail__title')}>{activity.title}</div>
                </div>
                <div className={cx('activity-detail__group')}>
                  <div className={cx('activity-detail__group-badge')}>
                    <span>{activity.category || 'Hoạt động CTXH'}</span>
                  </div>
                  {activity.pointGroupLabel && (
                    <div className={cx('activity-detail__group-badge')}>
                      <span>{activity.pointGroupLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16} className={cx('activity-detail__content-column')}>
                  <div className={cx('activity-detail__content', 'activity-detail__content--description')}>
                    <h2 className={cx('activity-detail__content-title')}>Mô tả</h2>
                    <div className={cx('activity-detail__content-body')}>
                      {activity?.description ? (
                        <p className={cx('activity-detail__paragraph')}>{activity.description}</p>
                      ) : (
                        <span>Không có mô tả</span>
                      )}
                    </div>

                    <section className={cx('activity-detail__benefit')}>
                      <h3 className={cx('activity-detail__benefit-title')}>Quyền lợi khi tham gia:</h3>
                      {benefitItems.length ? (
                        <ul className={cx('activity-detail__benefit-list')}>
                          {benefitItems.map((item, index) => (
                            <li key={`${item}-${index}`} className={cx('activity-detail__benefit-item')}>
                              <FontAwesomeIcon icon={faCircleCheck} className={cx('activity-detail__benefit-icon')} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Empty description="Chưa có thông tin quyền lợi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </section>

                    <section className={cx('activity-detail__responsibility')}>
                      <h3 className={cx('activity-detail__responsibility-title')}>Trách nhiệm của người tham gia:</h3>
                      {responsibilityItems.length ? (
                        <ul className={cx('activity-detail__responsibility-list')}>
                          {responsibilityItems.map((item, index) => (
                            <li key={`${item}-${index}`} className={cx('activity-detail__responsibility-item')}>
                              <FontAwesomeIcon
                                icon={faTriangleExclamation}
                                className={cx('activity-detail__responsibility-icon')}
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Empty description="Chưa có thông tin trách nhiệm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </section>
                  </div>

                  <div className={cx('activity-detail__tabs')}>
                    <Tabs defaultActiveKey="1" items={tabItems} type="line" size="large" tabBarGutter={12} />
                  </div>
                </Col>

                <Col xs={24} lg={8}>
                  <aside className={cx('activity-detail__sidebar')}>
                    <div className={cx('activity-detail__sidebar-points')}>
                      <div className={cx('activity-detail__points-value')}>
                        {activity.points != null ? `${activity.points} điểm` : '--'}
                      </div>
                      <div className={cx('activity-detail__points-label')}>Điểm hoạt động CTXH</div>
                    </div>

                    <div className={cx('activity-detail__sidebar-info')}>
                      <div className={cx('activity-detail__info-row')}>
                        <span className={cx('activity-detail__info-label')}>Ngày bắt đầu</span>
                        <span className={cx('activity-detail__info-value')}>{formatDate(activity.startTime)}</span>
                      </div>
                      <div className={cx('activity-detail__info-row')}>
                        <span className={cx('activity-detail__info-label')}>Ngày kết thúc</span>
                        <span className={cx('activity-detail__info-value')}>{formatDate(activity.endTime)}</span>
                      </div>
                      <div className={cx('activity-detail__info-row')}>
                        <span className={cx('activity-detail__info-label')}>Thời gian</span>
                        <span className={cx('activity-detail__info-value')}>
                          {formatTimeRange(activity.startTime, activity.endTime)}
                        </span>
                      </div>
                      <div
                        className={cx('activity-detail__info-row')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
                      >
                        <span className={cx('activity-detail__info-label')}>Địa điểm</span>
                        <span
                          className={cx('activity-detail__info-value')}
                          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', textAlign: 'left' }}
                        >
                          {activity.location || 'Đang cập nhật'}
                        </span>
                      </div>
                    </div>

                    <div className={cx('activity-detail__sidebar-registration')}>
                      <div className={cx('activity-detail__registration-header')}>
                        <span className={cx('activity-detail__registration-label')}>Số lượng đăng ký</span>
                        <span className={cx('activity-detail__registration-count')}>
                          {capacityInfo.hasLimit
                            ? `${capacityInfo.current}/${capacityInfo.total}`
                            : capacityInfo.current}
                        </span>
                      </div>
                      <div className={cx('activity-detail__registration-progress')}>
                        <div className={cx('activity-detail__registration-bar')} style={{ width: `${percent}%` }} />
                      </div>
                      <div className={cx('activity-detail__registration-remaining')}>
                        {capacityInfo.hasLimit
                          ? remaining > 0
                            ? `Còn ${remaining} chỗ trống`
                            : 'Đã đủ số lượng'
                          : 'Không giới hạn số lượng'}
                      </div>
                    </div>

                    <div className={cx('activity-detail__sidebar-deadline')}>
                      <div className={cx('activity-detail__info-row')}>
                        <span className={cx('activity-detail__info-label')}>Hạn đăng ký</span>
                        <span className={cx('activity-detail__info-value')}>
                          {activity.startTime ? formatDateTime(activity.startTime) : 'Đang cập nhật'}
                        </span>
                      </div>
                      <div className={cx('activity-detail__info-row')}>
                        <span className={cx('activity-detail__info-label')}>Hạn hủy đăng ký</span>
                        <span className={cx('activity-detail__info-value')}>
                          {activity.startTime
                            ? formatDateTime(dayjs(activity.startTime).subtract(3, 'day'))
                            : 'Đang cập nhật'}
                        </span>
                      </div>
                    </div>

                    <div className={cx('activity-detail__sidebar-checkin')}>
                      <div className={cx('activity-detail__checkin-label')}>Phương thức điểm danh</div>
                      <div className={cx('activity-detail__checkin-methods')}>
                        <span className={cx('activity-detail__checkin-badge', 'activity-detail__checkin-badge--qr')}>
                          QR Code
                        </span>
                        <span
                          className={cx('activity-detail__checkin-badge', 'activity-detail__checkin-badge--checkin')}
                        >
                          Check in
                        </span>
                      </div>
                    </div>

                    {renderActionButton()}
                  </aside>
                  <aside className={cx('activity-detail__organizer')}>
                    <h3 className={cx('activity-detail__organizer-title')}>Ban tổ chức</h3>

                    <div className={cx('activity-detail__organizer-profile')}>
                      <img
                        src="https://placehold.co/48x48"
                        alt="Organizer avatar"
                        className={cx('activity-detail__organizer-avatar')}
                      />
                      <div className={cx('activity-detail__organizer-info')}>
                        <div className={cx('activity-detail__organizer-name')}>Thầy: Nguyễn Văn Minh</div>
                        <div className={cx('activity-detail__organizer-role')}>Trưởng ban tổ chức</div>
                      </div>
                    </div>

                    <div className={cx('activity-detail__organizer-contact')}>
                      <div className={cx('activity-detail__contact-item')}>
                        <FontAwesomeIcon icon={faPhone} className={cx('activity-detail__contact-icon')} />
                        <span className={cx('activity-detail__contact-text')}>0987.654.321</span>
                      </div>
                      <div className={cx('activity-detail__contact-item')}>
                        <FontAwesomeIcon icon={faEnvelope} className={cx('activity-detail__contact-icon')} />
                        <span className={cx('activity-detail__contact-text')}>minh.nv@huit.edu.vn</span>
                      </div>
                    </div>

                    <button className={cx('activity-detail__organizer-button')}>
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>Liên hệ ngay</span>
                    </button>
                  </aside>
                </Col>
              </Row>
            </div>

            <Label
              title="Hoạt động"
              highlight="liên quan"
              subtitle="Khám phá các hoạt động liên quan cùng nhóm để tích lũy điểm CTXH"
            />

            <div className={cx('activity-detail__related')}>
              <div className={cx('activity-detail__related-list')}>
                {relatedActivities.map((item) => (
                  <CardActivity
                    key={item.id}
                    {...item}
                    variant="vertical"
                    state={item.state || 'details_only'}
                    onRegistered={async ({ note }) => {
                      await activitiesApi.register(item.id, { note });
                      queryClient.invalidateQueries(['activities', 'related', id]);
                    }}
                    onCancelRegister={async ({ reason, note }) => {
                      await activitiesApi.cancel(item.id, { reason, note });
                      queryClient.invalidateQueries(['activities', 'related', id]);
                    }}
                    onConfirmPresent={async ({ dataUrl, file, phase }) => {
                      let evidenceDataUrl = dataUrl ?? null;
                      if (!evidenceDataUrl && file) {
                        evidenceDataUrl = await fileToDataUrl(file);
                      }
                      await activitiesApi.attendance(item.id, {
                        status: 'present',
                        phase,
                        evidence: evidenceDataUrl
                          ? { data: evidenceDataUrl, mimeType: file?.type, fileName: file?.name }
                          : undefined,
                      });
                      queryClient.invalidateQueries(['activities', 'related', id]);
                    }}
                    onSendFeedback={async ({ content, files }) => {
                      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
                      await activitiesApi.feedback(item.id, { content, attachments });
                      queryClient.invalidateQueries(['activities', 'related', id]);
                    }}
                  />
                ))}
              </div>

              <div className={cx('activity-detail__related-actions')}>
                <Link to="/list-activities">
                  <Button variant="primary">
                    <span>Xem tất cả</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <RegisterModal
        open={isRegisterOpen}
        onCancel={() => setIsRegisterOpen(false)}
        onConfirm={handleConfirmRegister}
        variant={modalVariant}
        campaignName={activity?.title}
        groupLabel={activity?.pointGroupLabel}
        pointsLabel={activity?.points != null ? `${activity.points} điểm` : undefined}
        dateTime={activity?.dateTime}
        location={activity?.location}
      />

      <CheckModal
        open={isCheckOpen}
        onCancel={() => setIsCheckOpen(false)}
        onSubmit={handleAttendanceSubmit}
        campaignName={activity?.title}
        groupLabel={activity?.pointGroupLabel}
        pointsLabel={activity?.points != null ? `${activity.points} điểm` : undefined}
        dateTime={activity?.dateTime}
        location={activity?.location}
        confirmLoading={attendanceMutation.isPending}
        phase={attendancePhase}
      />

      <FeedbackModal
        open={isFeedbackOpen}
        onCancel={() => setIsFeedbackOpen(false)}
        onSubmit={async ({ content, files }) => {
          try {
            const attachments = (files || []).map((file) => file?.name).filter(Boolean);
            await activitiesApi.feedback(id, { content, attachments });
            queryClient.invalidateQueries(['activity', id]);
            setIsFeedbackOpen(false);
            toast({ message: 'Gửi phản hồi thành công!', variant: 'success' });
          } catch (error) {
            const message = error.response?.data?.error || 'Gửi phản hồi thất bại. Vui lòng thử lại.';
            toast({ message, variant: 'danger' });
          }
        }}
        campaignName={activity?.title}
        groupLabel={activity?.pointGroupLabel}
        pointsLabel={activity?.points != null ? `${activity.points} điểm` : undefined}
        dateTime={activity?.dateTime}
        location={activity?.location}
      />
    </section>
  );
}

export default ActivityDetailPage;
