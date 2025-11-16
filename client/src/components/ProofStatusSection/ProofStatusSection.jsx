import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { Empty, Skeleton } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faEye,
  faTriangleExclamation,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import useAuthStore from '@stores/useAuthStore';
import Button from '../Button/Button';
import useToast from '@components/Toast/Toast';
import Label from '../Label/Label';
import fallbackImage from '@assets/images/activity-cover.png';
import styles from './ProofStatusSection.module.scss';

const cx = classNames.bind(styles);

const FEEDBACK_STATE_DISPLAY = {
  feedback_accepted: { status: 'approved', label: 'Đã duyệt' },
  feedback_reviewing: { status: 'processing', label: 'Đang xử lý' },
  feedback_pending: { status: 'processing', label: 'Chờ minh chứng' },
  feedback_denied: { status: 'rejected', label: 'Từ chối' },
};

const ALLOWED_FEEDBACK_STATES = ['feedback_pending', 'feedback_reviewing', 'feedback_accepted', 'feedback_denied'];

const statusIcons = {
  approved: faCircleCheck,
  processing: faClock,
  rejected: faXmarkCircle,
  reason: faTriangleExclamation,
};

function ProofStatusSection() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { contextHolder, open: toast } = useToast();

  const { data: registrations = [], isFetching } = useQuery({
    queryKey: [...MY_ACTIVITIES_QUERY_KEY, 'proof-status'],
    queryFn: () => activitiesApi.listMine({ status: 'DA_THAM_GIA' }),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    retry: 1,
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể tải trạng thái minh chứng.';
      toast({ message, variant: 'danger' });
    },
  });

  const proofItems = useMemo(() => {
    if (!isLoggedIn) return [];

    return (registrations || [])
      .filter((registration) => {
        const activityState = registration?.activity?.state;
        if (!activityState || !ALLOWED_FEEDBACK_STATES.includes(activityState)) {
          return false;
        }

        if (activityState === 'feedback_accepted' && !registration?.feedback) {
          return false;
        }

        return Boolean(registration?.activity);
      })
      .map((registration) => {
        const activity = registration.activity;
        const feedback = registration.feedback;
        const mapping = FEEDBACK_STATE_DISPLAY[activity?.state] || {
          status: 'processing',
          label: 'Đang xử lý',
        };

        const reason = mapping.status === 'rejected' && feedback?.content ? String(feedback.content).trim() : null;

        const infoParts = [];
        if (activity?.pointGroupLabel) infoParts.push(activity.pointGroupLabel);
        if (typeof activity?.points === 'number') infoParts.push(`${activity.points} điểm`);
        const activityLabel = infoParts.length ? `${infoParts.join(' • ')}` : 'Hoạt động bạn đã tham gia';

        const sortTime = new Date(
          feedback?.updatedAt ||
            registration.updatedAt ||
            registration.approvedAt ||
            activity?.updatedAt ||
            activity?.startTime ||
            0,
        ).getTime();

        return {
          id: registration.id,
          title: activity?.title || 'Hoạt động của bạn',
          imageUrl: activity?.coverImage || fallbackImage,
          activityLabel,
          status: mapping.status,
          statusLabel: mapping.label,
          reason,
          sortTime,
        };
      })
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 3);
  }, [isLoggedIn, registrations]);

  const canShowViewAll = Array.isArray(proofItems) && proofItems.length > 3 && !isFetching;

  return (
    <>
      {contextHolder}

      <Label
        className={cx('proof-status__label')}
        title="Trạng thái"
        highlight="phản hồi"
        subtitle="Phản hồi điểm nếu có xảy ra sai sót"
        leftDivider
        rightDivider
        showSubtitle
      />

      <div className={cx('proof-status')}>
        <div className={cx('proof-status__cards')}>
          {isFetching ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className={cx('proof-status__card')}>
                <Skeleton
                  active
                  avatar={{ shape: 'square', size: 64 }}
                  paragraph={{ rows: 2, width: ['80%', '60%'] }}
                  title={false}
                />
              </div>
            ))
          ) : proofItems.length > 0 ? (
            proofItems.map((item) => {
              const showReason = item.status === 'rejected' && !!item.reason;

              return (
                <div key={item.id} className={cx('proof-status__card')}>
                  <div className={cx('proof-status__card-content')}>
                    <div className={cx('proof-status__card-info')}>
                      <div className={cx('proof-status__thumbnail')}>
                        <img src={item.imageUrl || fallbackImage} alt={item.title} />
                      </div>

                      <div className={cx('proof-status__details')}>
                        <div className={cx('proof-status__title')}>{item.title}</div>
                        <div className={cx('proof-status__activity')}>{item.activityLabel}</div>

                        {showReason && (
                          <div className={cx('proof-status__reason')} role="alert" aria-live="polite">
                            <div
                              className={cx('proof-status__reason-icon', `proof-status__reason-icon--${item.status}`)}
                            >
                              <FontAwesomeIcon icon={statusIcons.reason} />
                            </div>
                            <span className={cx('proof-status__reason-text')}>Lý do từ chối: {item.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={cx('proof-status__status-area')}>
                      <div className={cx('proof-status__status-badge', `proof-status__status-badge--${item.status}`)}>
                        <div className={cx('proof-status__status-icon', `proof-status__status-icon--${item.status}`)}>
                          <FontAwesomeIcon icon={statusIcons[item.status]} />
                        </div>
                        <span className={cx('proof-status__status-text')}>{item.statusLabel}</span>
                      </div>

                      <button
                        type="button"
                        className={cx('proof-status__action-button')}
                        aria-label="Xem minh chứng"
                        title="Xem minh chứng"
                        onClick={() => navigate('/feedback')}
                      >
                        <FontAwesomeIcon className={cx('proof-status__action-icon')} icon={faEye} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={cx('proof-status__empty')}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={isLoggedIn ? 'Chưa có phản hồi nào' : 'Đăng nhập để xem trạng thái phản hồi'}
              />
            </div>
          )}
        </div>

        {canShowViewAll && (
          <div className={cx('proof-status__actions')}>
            <Link to="/feedback">
              <Button variant="primary">
                <span style={{ marginRight: '5px' }}>Xem tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </Button>
            </Link>
          </div>
        )}

        <div className={cx('proof-status__guidelines')}>
          <div className={cx('proof-status__guidelines-header')}>
            <div className={cx('proof-status__guidelines-icon')}>
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>
            <span className={cx('proof-status__guidelines-title')}>Hướng dẫn gửi minh chứng</span>
          </div>
          <ul className={cx('proof-status__guidelines-list')}>
            <li>Ảnh phải rõ nét, không bị mờ hoặc nghiêng</li>
            <li>Chụp toàn bộ chứng nhận/giấy tờ, không bị cắt xén</li>
            <li>Định dạng hỗ trợ: JPG, PNG, PDF (tối đa 5MB)</li>
            <li>Nội dung phải khớp với hoạt động đã đăng ký</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default ProofStatusSection;
