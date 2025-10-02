import React from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleInfo,
  faClock,
  faXmarkCircle,
  faEye,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import Label from '../Label/Label';
import styles from './ProofStatusSection.module.scss';
// import mockApi from '../../utils/mockAPI';

const cx = classNames.bind(styles);

const proofItems = [
  {
    title: 'Ngày hội hiến máu nhân đạo',
    activity: 'Hoạt động: Hiến máu • 30 điểm',
    status: 'approved',
    statusLabel: 'Đã duyệt',
    imageUrl: 'https://placehold.co/64x64',
  },
  {
    title: 'Chiến dịch làm sạch bãi biển',
    activity: 'Hoạt động: Mùa hè xanh • 20 điểm',
    status: 'processing',
    statusLabel: 'Đang xử lý',
    imageUrl: 'https://placehold.co/64x64',
  },
  {
    title: 'Trồng cây xanh tại công viên',
    activity: 'Hoạt động: Mùa hè xanh • 12 điểm',
    status: 'rejected',
    statusLabel: 'Từ chối',
    reason: 'Lý do từ chối: Ảnh mờ không rõ nét, không thể xác minh được hoạt động',
    imageUrl: 'https://placehold.co/64x64',
  },
];

const statusIcons = {
  approved: faCircleCheck,
  processing: faClock,
  rejected: faXmarkCircle,
  reason: faTriangleExclamation,
};

function ProofStatusSection() {
  return (
    <>
      <Label title="Trạng thái" highlight="minh chứng" subtitle="Phản hồi điểm nếu có xảy ra sai sót" />

      <div className={cx('proof-status')}>
        <div className={cx('proof-status__cards')}>
          {proofItems.map((item) => {
            const showReason = item.status === 'rejected' && !!item.reason;
            const reasonText = showReason ? String(item.reason).replace(/^Lý do( từ chối)?:\s*/i, '') : '';

            return (
              <div key={item.id || item.title} className={cx('proof-status__card')}>
                <div className={cx('proof-status__card-content')}>
                  <div className={cx('proof-status__card-info')}>
                    <div className={cx('proof-status__thumbnail')}>
                      <img src={item.imageUrl} alt={item.title} />
                    </div>

                    <div className={cx('proof-status__details')}>
                      <div className={cx('proof-status__title')}>{item.title}</div>
                      <div className={cx('proof-status__activity')}>{item.activity}</div>

                      {showReason && (
                        <div className={cx('proof-status__reason')} role="alert" aria-live="polite">
                          <div className={cx('proof-status__reason-icon', `proof-status__reason-icon--${item.status}`)}>
                            <FontAwesomeIcon icon={statusIcons.reason} />
                          </div>
                          <span className={cx('proof-status__reason-text')}>Lý do từ chối: {reasonText}</span>
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
                      onClick={() => {
                        // TODO: thêm handler mở modal / xem ảnh / điều hướng
                        // ví dụ: openPreview(item)
                      }}
                    >
                      <FontAwesomeIcon className={cx('proof-status__action-icon')} icon={faEye} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
