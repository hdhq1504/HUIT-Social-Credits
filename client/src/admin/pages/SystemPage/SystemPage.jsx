import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Button, Upload } from 'antd';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faClockRotateLeft, faDownload, faShieldHalved, faUpload } from '@fortawesome/free-solid-svg-icons';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import systemApi from '@/api/system.api';
import styles from './SystemPage.module.scss';

const cx = classNames.bind(styles);
const { Dragger } = Upload;

const COUNT_LABELS = {
  users: 'Người dùng',
  schoolYears: 'Năm học',
  semesters: 'Học kỳ',
  activities: 'Hoạt động',
  registrations: 'Đăng ký',
  checkIns: 'Điểm danh',
  feedbacks: 'Phản hồi',
  notifications: 'Thông báo',
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa có dữ liệu';
  return dayjs(value).format('HH:mm DD/MM/YYYY');
};

const buildFileName = (timestamp) => {
  const safeTimestamp = (timestamp || new Date().toISOString()).replace(/[.:]/g, '-');
  return `huit-social-credits-backup-${safeTimestamp}.json`;
};

const normalizeCounts = (counts) => {
  if (!counts || typeof counts !== 'object') return [];
  return Object.entries(counts).map(([key, value]) => ({
    key,
    label: COUNT_LABELS[key] || key,
    value: Array.isArray(value) ? value.length : value,
  }));
};

export default function SystemPage() {
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [lastBackup, setLastBackup] = useState(null);
  const [lastRestore, setLastRestore] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  const backupMutation = useMutation({
    mutationFn: () => systemApi.backup(),
    onSuccess: (response) => {
      const metadata = response?.metadata ?? {};
      const data = response?.data ?? {};
      const fileName = buildFileName(metadata.createdAt);
      const serialized = JSON.stringify({ metadata, data }, null, 2);
      const blob = new Blob([serialized], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setLastBackup({ metadata, fileName });
      openToast({ message: 'Đã tạo và tải xuống bản sao lưu thành công.', variant: 'success' });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể tạo bản sao lưu. Vui lòng thử lại.', variant: 'danger' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ backupData }) => systemApi.restore(backupData),
    onSuccess: (response, variables) => {
      const summary = response?.summary ?? {};
      setLastRestore({
        restoredAt: summary.restoredAt || new Date().toISOString(),
        counts: summary.counts || {},
        fileName: variables?.fileName || '',
      });
      setSelectedFileName(variables?.fileName || '');
      openToast({ message: response?.message || 'Khôi phục dữ liệu thành công.', variant: 'success' });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Khôi phục dữ liệu thất bại. Vui lòng kiểm tra lại tệp.', variant: 'danger' });
    },
  });

  const { mutate: triggerBackup, isPending: isBackupPending } = backupMutation;
  const { mutate: triggerRestore, isPending: isRestorePending } = restoreMutation;

  const handleDownloadBackup = useCallback(() => {
    triggerBackup();
  }, [triggerBackup]);

  const handleRestoreFile = useCallback(
    (file) => {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result;
          const parsed = JSON.parse(text);
          const backupData = parsed?.data && typeof parsed.data === 'object' ? parsed : { data: parsed };
          triggerRestore({ backupData, fileName: file.name });
        } catch {
          openToast({ message: 'Tệp backup không hợp lệ. Vui lòng chọn lại.', variant: 'danger' });
        }
      };
      reader.onerror = () => {
        openToast({ message: 'Không thể đọc tệp backup. Vui lòng thử lại.', variant: 'danger' });
      };
      reader.readAsText(file);
      return false;
    },
    [openToast, triggerRestore],
  );

  const uploadProps = useMemo(
    () => ({
      name: 'backup',
      multiple: false,
      accept: '.json',
      showUploadList: false,
      beforeUpload: handleRestoreFile,
      disabled: isRestorePending,
    }),
    [handleRestoreFile, isRestorePending],
  );

  const backupCounts = useMemo(() => normalizeCounts(lastBackup?.metadata?.counts), [lastBackup]);
  const restoreCounts = useMemo(() => normalizeCounts(lastRestore?.counts), [lastRestore]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Quản lý hệ thống', path: ROUTE_PATHS.ADMIN.SYSTEM },
    ]);

    setPageActions([
      {
        key: 'download-backup',
        label: 'Tải xuống backup',
        type: 'primary',
        icon: <FontAwesomeIcon icon={faDownload} />,
        onClick: handleDownloadBackup,
        loading: isBackupPending,
        className: styles['system-page__action-button'],
      },
    ]);

    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [handleDownloadBackup, isBackupPending, setBreadcrumbs, setPageActions]);

  return (
    <div className={cx('system-page')}>
      {contextHolder}
      <section className={cx('system-page__intro')}>
        <div className={cx('system-page__intro-icon')}>
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>
        <div className={cx('system-page__intro-content')}>
          <h1 className={cx('system-page__intro-title')}>Trung tâm sao lưu &amp; phục hồi</h1>
          <p className={cx('system-page__intro-description')}>
            Duy trì an toàn dữ liệu bằng cách sao lưu định kỳ và khôi phục nhanh chóng khi có sự cố.
          </p>
        </div>
      </section>

      <div className={cx('system-page__grid')}>
        <section className={cx('system-page__card', 'system-page__card--backup')}>
          <div className={cx('system-page__card-header')}>
            <div className={cx('system-page__card-icon', 'system-page__card-icon--backup')}>
              <FontAwesomeIcon icon={faDownload} />
            </div>
            <div>
              <h2 className={cx('system-page__card-title')}>Sao lưu dữ liệu</h2>
              <p className={cx('system-page__card-description')}>
                Tạo tệp backup JSON chứa toàn bộ dữ liệu quan trọng của hệ thống.
              </p>
            </div>
          </div>

          <div className={cx('system-page__card-body')}>
            {backupCounts.length ? (
              <ul className={cx('system-page__stat-list')}>
                {backupCounts.map((item) => (
                  <li key={item.key} className={cx('system-page__stat-item')}>
                    <span className={cx('system-page__stat-label')}>{item.label}</span>
                    <span className={cx('system-page__stat-value')}>{item.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cx('system-page__empty-state')}>
                Chưa có thông tin về bản sao lưu nào. Hãy tạo bản sao lưu đầu tiên ngay bây giờ.
              </p>
            )}

            <p className={cx('system-page__card-note')}>
              <FontAwesomeIcon icon={faCircleInfo} />
              <span>Sao lưu định kỳ giúp bạn sẵn sàng khôi phục dữ liệu khi xảy ra sự cố ngoài ý muốn.</span>
            </p>
          </div>

          <div className={cx('system-page__card-footer')}>
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={faDownload} />}
              onClick={handleDownloadBackup}
              loading={isBackupPending}
              className={cx('system-page__action-button')}
            >
              Tải xuống tệp backup
            </Button>
            {lastBackup?.metadata?.createdAt && (
              <span className={cx('system-page__timestamp')}>
                <FontAwesomeIcon icon={faClockRotateLeft} />
                Lần gần nhất: {formatDateTime(lastBackup.metadata.createdAt)}
              </span>
            )}
          </div>
        </section>

        <section className={cx('system-page__card', 'system-page__card--restore')}>
          <div className={cx('system-page__card-header')}>
            <div className={cx('system-page__card-icon', 'system-page__card-icon--restore')}>
              <FontAwesomeIcon icon={faUpload} />
            </div>
            <div>
              <h2 className={cx('system-page__card-title')}>Khôi phục dữ liệu</h2>
              <p className={cx('system-page__card-description')}>
                Tải lên tệp backup để khôi phục toàn bộ dữ liệu về trạng thái đã lưu.
              </p>
            </div>
          </div>

          <div className={cx('system-page__card-body')}>
            <div className={cx('system-page__upload')}>
              <Dragger {...uploadProps}>
                <div className={cx('system-page__upload-icon')}>
                  <FontAwesomeIcon icon={faUpload} />
                </div>
                <p className={cx('system-page__upload-title')}>Kéo thả hoặc chọn tệp backup (.json)</p>
                <p className={cx('system-page__upload-subtitle')}>
                  Hệ thống sẽ kiểm tra cấu trúc và thay thế toàn bộ dữ liệu hiện tại.
                </p>
              </Dragger>
              <p className={cx('system-page__upload-hint')}>
                Lưu ý: Quá trình khôi phục có thể mất vài phút tùy theo dung lượng dữ liệu.
              </p>
              {selectedFileName && <p className={cx('system-page__file-name')}>{selectedFileName}</p>}
            </div>

            {restoreCounts.length ? (
              <ul className={cx('system-page__stat-list')}>
                {restoreCounts.map((item) => (
                  <li key={item.key} className={cx('system-page__stat-item')}>
                    <span className={cx('system-page__stat-label')}>{item.label}</span>
                    <span className={cx('system-page__stat-value', 'system-page__stat-value--accent')}>{item.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cx('system-page__empty-state')}>
                Chưa có phiên khôi phục nào được thực hiện. Tải lên tệp backup để bắt đầu.
              </p>
            )}

            <p className={cx('system-page__card-note')}>
              <FontAwesomeIcon icon={faCircleInfo} />
              <span>Khôi phục dữ liệu sẽ ghi đè tất cả thông tin hiện tại. Hãy chắc chắn bạn đã sao lưu mới nhất.</span>
            </p>
          </div>

          <div className={cx('system-page__card-footer')}>
            {lastRestore?.restoredAt && (
              <span className={cx('system-page__timestamp', 'system-page__timestamp--restore')}>
                <FontAwesomeIcon icon={faClockRotateLeft} />
                Khôi phục gần nhất: {formatDateTime(lastRestore.restoredAt)}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
