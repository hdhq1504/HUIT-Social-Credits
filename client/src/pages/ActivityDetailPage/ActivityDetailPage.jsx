import React, { useMemo, useState } from 'react';
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
import { Col, Row, Tabs } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@components/Button/Button';
import CardActivity from '@components/CardActivity/CardActivity';
import CheckModal from '@components/CheckModal/CheckModal';
import RegisterModal from '@components/RegisterModal/RegisterModal';
import FeedbackModal from '@components/FeedbackModal/FeedbackModal';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import Loading from '@pages/Loading/Loading';
import activitiesApi from '@api/activities.api';
import { fileToDataUrl } from '@utils/file';
import styles from './ActivityDetailPage.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value, format = 'DD/MM/YYYY') => (value ? dayjs(value).format(format) : '--');
const formatDateTime = (value) => (value ? dayjs(value).format('HH:mm DD/MM/YYYY') : '--');
const formatTimeRange = (start, end) => {
  if (!start && !end) return '--';
  const s = start ? dayjs(start).format('HH:mm') : '--';
  const e = end ? dayjs(end).format('HH:mm') : '--';
  return `${s} - ${e}`;
};

function ActivityDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState('confirm');
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { contextHolder, open: toast } = useToast();

  // Query for activity details
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

  // Query for related activities
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

  // Mutations for activity actions
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
    onSuccess: () => {
      queryClient.invalidateQueries(['activity', id]);
      setIsCheckOpen(false);
      toast({ message: 'Điểm danh thành công!', variant: 'success' });
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
      } catch (error) {
        toast({ message: 'Không thể đọc dữ liệu ảnh điểm danh. Vui lòng thử lại.', variant: 'danger' });
        return;
      }
    }

    attendanceMutation.mutate({
      id,
      payload: {
        status: 'present',
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

  const benefitItems = useMemo(
    () => [
      'Nhận điểm hoạt động CTXH tương ứng',
      'Được cấp giấy chứng nhận tham gia từ Ban tổ chức',
      'Hỗ trợ chi phí ăn uống và di chuyển theo quy định',
      'Nhận áo đồng phục và các vật phẩm kỷ niệm',
      'Cơ hội giao lưu, kết nối với sinh viên các trường',
    ],
    [],
  );

  const responsibilityItems = useMemo(
    () => ['Tham gia đầy đủ các hoạt động theo lịch trình', 'Tuân thủ nghiêm túc các quy định an toàn'],
    [],
  );

  const requirementItems = useMemo(
    () => [
      { icon: 'faUserGraduate', text: 'Là sinh viên đang học tại các trường đại học, cao đẳng' },
      { icon: 'faHeartPulse', text: 'Không có các bệnh lý ảnh hưởng đến hoạt động ngoài trời' },
      { icon: 'faClock', text: 'Cam kết tham gia đầy đủ hoạt động theo kế hoạch' },
      { icon: 'faShieldHeart', text: 'Có bảo hiểm y tế và cam kết tuân thủ các quy định an toàn' },
    ],
    [],
  );

  const guideSteps = useMemo(
    () => [
      {
        title: 'Bước 1: Đăng ký tham gia',
        content: 'Điền đầy đủ thông tin vào form đăng ký trực tuyến trước thời hạn quy định.',
      },
      {
        title: 'Bước 2: Xác nhận thông tin',
        content: 'Ban tổ chức sẽ gửi email xác nhận trong vòng 24 giờ. Kiểm tra email và xác nhận tham gia.',
      },
      {
        title: 'Bước 3: Tham gia briefing',
        content: 'Tham dự buổi họp trực tuyến để nắm rõ lịch trình và quy định khi tham gia hoạt động.',
      },
      {
        title: 'Bước 4: Chuẩn bị cá nhân',
        content: 'Chuẩn bị đầy đủ đồ dùng cá nhân và phương tiện theo hướng dẫn của ban tổ chức.',
      },
    ],
    [],
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
            <ul className={cx('activity-detail__requirement-list')}>
              {requirementItems.map((item, index) => (
                <li key={index} className={cx('activity-detail__requirement-item')}>
                  <FontAwesomeIcon icon={faClipboardList} className={cx('activity-detail__requirement-icon')} />
                  <span className={cx('activity-detail__requirement-text')}>{item.text}</span>
                </li>
              ))}
            </ul>
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
            <div className={cx('activity-detail__guide-list')}>
              {guideSteps.map((step, index) => (
                <div key={index} className={cx('activity-detail__guide-item')}>
                  <h5 className={cx('activity-detail__guide-title')}>{step.title}</h5>
                  <p className={cx('activity-detail__guide-content')}>{step.content}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    [guideSteps, requirementItems],
  );

  const renderActionButton = () => {
    if (!activity) return null;
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
            onClick={() => setIsCheckOpen(true)}
          >
            Điểm danh
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
                      <ul className={cx('activity-detail__benefit-list')}>
                        {benefitItems.map((item) => (
                          <li key={item} className={cx('activity-detail__benefit-item')}>
                            <FontAwesomeIcon icon={faCircleCheck} className={cx('activity-detail__benefit-icon')} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className={cx('activity-detail__responsibility')}>
                      <h3 className={cx('activity-detail__responsibility-title')}>Trách nhiệm của người tham gia:</h3>
                      <ul className={cx('activity-detail__responsibility-list')}>
                        {responsibilityItems.map((item) => (
                          <li key={item} className={cx('activity-detail__responsibility-item')}>
                            <FontAwesomeIcon
                              icon={faTriangleExclamation}
                              className={cx('activity-detail__responsibility-icon')}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
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
                    onConfirmPresent={async ({ dataUrl, file }) => {
                      let evidenceDataUrl = dataUrl ?? null;
                      if (!evidenceDataUrl && file) {
                        evidenceDataUrl = await fileToDataUrl(file);
                      }
                      await activitiesApi.attendance(item.id, {
                        status: 'present',
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
